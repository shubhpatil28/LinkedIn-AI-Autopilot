/**
 * Unit tests for lib/scheduling.ts
 * Log output written to lib/scheduling.test.log for safe reading.
 */

import fs from 'fs';
import path from 'path';
import { getNextScheduledSlot, getDatePartsInTimezone, parseScheduledAt } from './scheduling';

const logPath = path.join(process.cwd(), 'lib', 'scheduling.test.log');
fs.writeFileSync(logPath, 'STARTING TESTS\n');

function log(msg: string) {
  fs.appendFileSync(logPath, msg + '\n');
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    log(`  PASS: ${label}`);
  } else {
    failed++;
    log(`  FAIL: ${label}`);
  }
}

function assertThrows(fn: () => void, label: string): void {
  try {
    fn();
    failed++;
    log(`  FAIL (no throw): ${label}`);
  } catch {
    passed++;
    log(`  PASS: ${label}`);
  }
}

// ---------------------------------------------------------------------------
// Test 1: Before 9 AM IST -> should return today's 09:00 IST slot
// ---------------------------------------------------------------------------
log('\n--- Test 1: Before 9:00 AM IST ---');
{
  // 2026-10-09 02:00 IST = 2026-10-08 20:30 UTC
  const now = new Date('2026-10-08T20:30:00.000Z');
  const slot = getNextScheduledSlot(now, '09:00', 'Asia/Kolkata');
  const slotDate = new Date(slot);

  // Expected: 2026-10-09 09:00 IST = 2026-10-09 03:30 UTC
  assert(slot === '2026-10-09T03:30:00.000Z', 'Today slot: ' + slot);
  assert(slotDate.getTime() > now.getTime(), 'Slot is in the future');
  assert(!isNaN(slotDate.getTime()), 'Valid ISO date');
}

// ---------------------------------------------------------------------------
// Test 2: After 9 AM IST -> should return tomorrow's 09:00 IST slot
// ---------------------------------------------------------------------------
log('\n--- Test 2: After 9:00 AM IST ---');
{
  // 2026-10-09 17:48 IST = 2026-10-09 12:18 UTC
  const now = new Date('2026-10-09T12:18:00.000Z');
  const slot = getNextScheduledSlot(now, '09:00', 'Asia/Kolkata');
  const slotDate = new Date(slot);

  // Expected: 2026-10-10 09:00 IST = 2026-10-10 03:30 UTC
  assert(slot === '2026-10-10T03:30:00.000Z', 'Tomorrow slot: ' + slot);
  assert(slotDate.getTime() > now.getTime(), 'Slot is in the future');
}

// ---------------------------------------------------------------------------
// Test 3: Around midnight IST -> should return today's 09:00 IST slot
// ---------------------------------------------------------------------------
log('\n--- Test 3: Around midnight IST (00:05) ---');
{
  // 2026-10-09 00:05 IST = 2026-10-08 18:35 UTC
  const now = new Date('2026-10-08T18:35:00.000Z');
  const slot = getNextScheduledSlot(now, '09:00', 'Asia/Kolkata');
  const slotDate = new Date(slot);

  // Expected: 2026-10-09 09:00 IST = 2026-10-09 03:30 UTC
  assert(slot === '2026-10-09T03:30:00.000Z', 'Today slot from midnight: ' + slot);
  assert(slotDate.getTime() > now.getTime(), 'Slot is in the future');
}

// ---------------------------------------------------------------------------
// Test 4: Exactly 09:00 IST -> should return tomorrow (slot has passed)
// ---------------------------------------------------------------------------
log('\n--- Test 4: Exactly 09:00 IST ---');
{
  // 2026-10-09 09:00:00 IST = 2026-10-09 03:30:00 UTC
  const now = new Date('2026-10-09T03:30:00.000Z');
  const slot = getNextScheduledSlot(now, '09:00', 'Asia/Kolkata');
  const slotDate = new Date(slot);

  // Expected: 2026-10-10 09:00 IST = 2026-10-10 03:30 UTC
  assert(slot === '2026-10-10T03:30:00.000Z', 'Tomorrow from exact 9AM: ' + slot);
  assert(slotDate.getTime() > now.getTime(), 'Slot is strictly in the future');
}

// ---------------------------------------------------------------------------
// Test 5: UTC ISO output validity
// ---------------------------------------------------------------------------
log('\n--- Test 5: ISO output format ---');
{
  const now = new Date('2026-10-09T12:00:00.000Z');
  const slot = getNextScheduledSlot(now, '09:00', 'Asia/Kolkata');

  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  assert(isoRegex.test(slot), 'Matches ISO format: ' + slot);
  assert(!isNaN(new Date(slot).getTime()), 'Parseable by new Date()');
}

// ---------------------------------------------------------------------------
// Test 6: Idempotency -- repeated calls with same input
// ---------------------------------------------------------------------------
log('\n--- Test 6: Idempotency ---');
{
  const now = new Date('2026-10-09T12:18:00.000Z');
  const slot1 = getNextScheduledSlot(now, '09:00', 'Asia/Kolkata');
  const slot2 = getNextScheduledSlot(now, '09:00', 'Asia/Kolkata');
  const slot3 = getNextScheduledSlot(now, '09:00', 'Asia/Kolkata');

  assert(slot1 === slot2, 'Call 1 === Call 2');
  assert(slot2 === slot3, 'Call 2 === Call 3');
}

// ---------------------------------------------------------------------------
// Test 7: Invalid posting time / timezone inputs
// ---------------------------------------------------------------------------
log('\n--- Test 7: Invalid inputs ---');
{
  const now = new Date();
  assertThrows(() => getNextScheduledSlot(now, 'invalid', 'Asia/Kolkata'), 'Invalid postingTime "invalid"');
  assertThrows(() => getNextScheduledSlot(now, '25:00', 'Asia/Kolkata'), 'Out-of-range postingTime "25:00"');
  assertThrows(() => getNextScheduledSlot(now, '09:60', 'Asia/Kolkata'), 'Out-of-range minute "09:60"');
  assertThrows(() => getNextScheduledSlot(now, '09:00', 'Invalid/Zone'), 'Invalid timezone');
  assertThrows(() => getNextScheduledSlot(now, '', 'Asia/Kolkata'), 'Empty postingTime');
}

// ---------------------------------------------------------------------------
// Test 8: getDatePartsInTimezone
// ---------------------------------------------------------------------------
log('\n--- Test 8: getDatePartsInTimezone ---');
{
  // 2026-10-09 03:30 UTC = 2026-10-09 09:00 IST
  const d = new Date('2026-10-09T03:30:00.000Z');
  const parts = getDatePartsInTimezone(d, 'Asia/Kolkata');
  assert(parts.year === 2026, 'Year: ' + parts.year);
  assert(parts.month === 10, 'Month: ' + parts.month);
  assert(parts.day === 9, 'Day: ' + parts.day);
  assert(parts.hour === 9, 'Hour: ' + parts.hour);
  assert(parts.minute === 0, 'Minute: ' + parts.minute);
}

// ---------------------------------------------------------------------------
// Test 9: parseScheduledAt with various formats
// ---------------------------------------------------------------------------
log('\n--- Test 9: parseScheduledAt ---');
{
  // ISO string
  const d1 = parseScheduledAt('2026-10-10T03:30:00.000Z');
  assert(d1 !== null && d1.toISOString() === '2026-10-10T03:30:00.000Z', 'ISO string parse');

  // Firestore Timestamp-like object
  const d2 = parseScheduledAt({ _seconds: 1791595800, _nanoseconds: 0 });
  assert(d2 !== null && d2 instanceof Date && !isNaN(d2.getTime()), 'Firestore _seconds parse');

  // Firestore with seconds (no underscore)
  const d3 = parseScheduledAt({ seconds: 1791595800, nanoseconds: 0 });
  assert(d3 !== null && d3 instanceof Date && !isNaN(d3.getTime()), 'Firestore seconds parse');

  // Number (epoch millis)
  const d4 = parseScheduledAt(1791595800000);
  assert(d4 !== null && d4 instanceof Date && !isNaN(d4.getTime()), 'Epoch millis parse');

  // null / undefined
  assert(parseScheduledAt(null) === null, 'null -> null');
  assert(parseScheduledAt(undefined) === null, 'undefined -> null');

  // Invalid string
  assert(parseScheduledAt('not-a-date') === null, 'Invalid string -> null');

  // Object with toDate()
  const fakeTimestamp = { toDate: () => new Date('2026-10-10T03:30:00.000Z') };
  const d5 = parseScheduledAt(fakeTimestamp);
  assert(d5 !== null && d5.toISOString() === '2026-10-10T03:30:00.000Z', 'toDate() parse');
}

// ---------------------------------------------------------------------------
// Test 10: Different posting times
// ---------------------------------------------------------------------------
log('\n--- Test 10: Different posting times ---');
{
  // 2026-10-09 14:00 IST = 2026-10-09 08:30 UTC. Posting at 15:00 IST should be today.
  const now = new Date('2026-10-09T08:30:00.000Z');
  const slot = getNextScheduledSlot(now, '15:00', 'Asia/Kolkata');
  // 15:00 IST = 09:30 UTC
  assert(slot === '2026-10-09T09:30:00.000Z', '15:00 IST today: ' + slot);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('\n========================================');
log('Results: ' + passed + ' passed, ' + failed + ' failed');
log('========================================\n');

if (failed > 0) {
  process.exit(1);
}
