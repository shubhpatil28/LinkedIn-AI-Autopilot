/**
 * IST-aware scheduling utility for LinkedIn AI Autopilot.
 *
 * Computes the next posting slot (e.g. 09:00 Asia/Kolkata) and returns it
 * as a UTC ISO-8601 string.  Uses Intl.DateTimeFormat for reliable timezone
 * conversion — no external dependencies, no reliance on browser locale.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract individual date/time parts for a given IANA timezone from a UTC Date.
 * Returns { year, month, day, hour, minute, second } in the target timezone.
 */
export function getDatePartsInTimezone(
  utcDate: Date,
  timezone: string
): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(utcDate);
  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const v = parts.find((p) => p.type === type)?.value ?? '0';
    // hour12:false may produce "24" for midnight in some engines — normalise
    return parseInt(v, 10);
  };

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') % 24, // normalise "24" → 0
    minute: get('minute'),
    second: get('second'),
  };
}

/**
 * Build a UTC Date that corresponds to a specific wall-clock time in a given
 * timezone on a specific date.
 *
 * Strategy: construct a UTC approximation, convert it to the target timezone,
 * then adjust by the difference (effective offset).
 */
export function buildUtcForWallClock(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezone: string
): Date {
  // Start with a naive UTC guess
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));

  // What does this UTC instant look like in the target timezone?
  const inTz = getDatePartsInTimezone(guess, timezone);

  // The difference (in minutes) between what we wanted and what we got tells
  // us the effective UTC offset of the timezone at that instant.
  const wantedMinutes = hour * 60 + minute;
  const gotMinutes = inTz.hour * 60 + inTz.minute;

  // Handle day-boundary wrap (e.g. wanted 00:30 but got 19:00 previous day)
  let diffMinutes = wantedMinutes - gotMinutes;
  if (diffMinutes > 720) diffMinutes -= 1440;
  if (diffMinutes < -720) diffMinutes += 1440;

  const adjusted = new Date(guess.getTime() + diffMinutes * 60_000);

  // Verify: the adjusted UTC instant should show the correct wall-clock
  const verify = getDatePartsInTimezone(adjusted, timezone);
  if (verify.hour !== hour || verify.minute !== minute) {
    // If still off (e.g. DST transition gap), nudge once more
    const verifyMin = verify.hour * 60 + verify.minute;
    const finalDiff = wantedMinutes - verifyMin;
    return new Date(adjusted.getTime() + finalDiff * 60_000);
  }

  return adjusted;
}

// ---------------------------------------------------------------------------
// Main API
// ---------------------------------------------------------------------------

/**
 * Parse a "HH:MM" posting-time string. Throws on invalid input.
 */
function parsePostingTime(postingTime: string): { hour: number; minute: number } {
  if (typeof postingTime !== 'string' || !/^\d{1,2}:\d{2}$/.test(postingTime)) {
    throw new Error(`Invalid postingTime format: "${postingTime}". Expected "HH:MM".`);
  }
  const [h, m] = postingTime.split(':').map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error(`postingTime out of range: "${postingTime}".`);
  }
  return { hour: h, minute: m };
}

/**
 * Validate that the given timezone string is supported by the runtime.
 */
function validateTimezone(timezone: string): void {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: timezone });
  } catch {
    throw new Error(`Unsupported timezone: "${timezone}".`);
  }
}

/**
 * Compute the next scheduled posting slot as a UTC ISO-8601 string.
 *
 * Rules:
 *  - If the posting slot for *today* (in the target timezone) is strictly in
 *    the future relative to `nowUtc`, return today's slot.
 *  - Otherwise return tomorrow's slot.
 *
 * @param nowUtc      Current time as a JS Date (UTC).
 * @param postingTime Wall-clock time in "HH:MM" format (e.g. "09:00").
 * @param timezone    IANA timezone string (e.g. "Asia/Kolkata").
 * @returns           UTC ISO-8601 string of the next slot.
 */
export function getNextScheduledSlot(
  nowUtc: Date,
  postingTime: string = '09:00',
  timezone: string = 'Asia/Kolkata'
): string {
  validateTimezone(timezone);
  const { hour, minute } = parsePostingTime(postingTime);

  // What is "today" in the target timezone?
  const todayParts = getDatePartsInTimezone(nowUtc, timezone);

  // Build today's slot in UTC
  const todaySlotUtc = buildUtcForWallClock(
    todayParts.year,
    todayParts.month,
    todayParts.day,
    hour,
    minute,
    timezone
  );

  // If today's slot is strictly in the future, use it
  if (todaySlotUtc.getTime() > nowUtc.getTime()) {
    return todaySlotUtc.toISOString();
  }

  // Otherwise, use tomorrow's slot
  // Advance by one calendar day in the target timezone
  const tomorrowGuess = new Date(todaySlotUtc.getTime() + 24 * 60 * 60_000);
  const tomorrowParts = getDatePartsInTimezone(tomorrowGuess, timezone);

  const tomorrowSlotUtc = buildUtcForWallClock(
    tomorrowParts.year,
    tomorrowParts.month,
    tomorrowParts.day,
    hour,
    minute,
    timezone
  );

  return tomorrowSlotUtc.toISOString();
}

/**
 * Safely parse a scheduledAt value that may be:
 *   - An ISO-8601 string
 *   - A Firestore Timestamp object ({ _seconds, _nanoseconds } or { seconds, nanoseconds })
 *   - A number (epoch millis)
 *   - null/undefined
 *
 * Returns a Date or null.
 */
export function parseScheduledAt(value: unknown): Date | null {
  if (value == null) return null;

  // Firestore Admin Timestamp object
  if (typeof value === 'object' && value !== null) {
    const v = value as Record<string, unknown>;
    const seconds = (v._seconds ?? v.seconds) as number | undefined;
    if (typeof seconds === 'number') {
      return new Date(seconds * 1000);
    }
    // Firestore Timestamp with toDate()
    if (typeof (v as { toDate?: () => Date }).toDate === 'function') {
      return (v as { toDate: () => Date }).toDate();
    }
  }

  if (typeof value === 'number') {
    return new Date(value);
  }

  if (typeof value === 'string') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}
