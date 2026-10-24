/**
 * Full Auto Mode - Per-User Generation Pipeline
 *
 * Orchestrates the complete end-to-end pipeline for Full Auto users:
 *   1. Validate LinkedIn connection + token
 *   2. Check whether today's posting slot is already occupied
 *   3. Select next topic via persistent round-robin rotation
 *   4. Research the topic (Tavily or curated fallback)
 *   5. Generate AI content (Gemini 1.5 Flash or curated fallback)
 *   6. Run quality + duplicate checks
 *   7. Generate SVG infographic + validate text content
 *   8. Convert SVG -> PNG (bundled fonts, resvg-js)
 *   9. Persist ContentItem to Firestore as SCHEDULED (skipped in dry-run)
 *  10. Return the generated post for the cron publish loop to pick up immediately
 *
 * DRY-RUN MODE: When dryRun=true, steps 9 and 10 are skipped.
 * The function validates everything (content, images) but writes nothing to
 * Firestore and does not push to LinkedIn. Safe to call at any time.
 */

import { adminDb } from '@/lib/firebaseAdmin';
import { getNextScheduledSlot, getDatePartsInTimezone, parseScheduledAt } from '@/lib/scheduling';
import { performTopicResearch } from './researchService';
import { generateLinkedInPostContent } from './aiService';
import { generateTopicVisualSvg } from './visualService';
import { convertSvgToPngBuffer, validateSvgOutput, validateSvgTextContent } from './serverVisualService';
import { runQualityCheck } from './qualityCheckService';
import { ContentItem, UserSettings, LinkedInConnection, Topic } from '@/types';

// ---------------------------------------------------------------------------
// Public result types
// ---------------------------------------------------------------------------

export interface AutoGenerationResult {
  /** Whether a post was generated (or would have been generated in dry-run) */
  generated: boolean;
  /** Why generation was skipped (slot occupied, no topics, quality failure, etc.) */
  skippedReason?: string;
  /** The persisted ContentItem (undefined in dry-run or on skip) */
  post?: ContentItem;
  /** The PNG buffer (available in dry-run for validation) */
  pngBuffer?: Buffer;
  /** Validation errors that prevented generation */
  errorReason?: string;
  /** Whether this was a dry-run (no Firestore writes) */
  dryRun: boolean;
}

export interface FullAutoUserResult {
  userId: string;
  status: 'generated' | 'skipped' | 'failed';
  generationResult?: AutoGenerationResult;
  errorReason?: string;
}

// ---------------------------------------------------------------------------
// Topic Selection - Persistent Round-Robin
// ---------------------------------------------------------------------------

/**
 * Selects the next topic using a persistent round-robin rotation cursor stored
 * in the user's settings (`lastTopicIndex`). Updates the cursor in Firestore
 * after selection so consecutive cron runs use different topics.
 *
 * Falls back to index 0 if cursor is missing or out of range.
 * Returns null if no enabled topics exist.
 */
export async function selectNextTopic(
  userId: string,
  settings: UserSettings,
  allTopics: Topic[]
): Promise<{ topic: Topic; newIndex: number } | null> {
  const enabled = allTopics.filter((t) => t.enabled && t.name?.trim());
  if (enabled.length === 0) return null;

  const currentIndex =
    typeof settings.lastTopicIndex === 'number' ? settings.lastTopicIndex : 0;

  // Clamp to valid range (handles newly disabled topics shrinking the list)
  const safeIndex = currentIndex % enabled.length;
  const selected = enabled[safeIndex];
  const nextIndex = (safeIndex + 1) % enabled.length;

  // Persist the updated cursor (non-fatal if this fails)
  try {
    await adminDb.collection('settings').doc(userId).update({
      lastTopicIndex: nextIndex,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn(`[AutoGen] Failed to persist lastTopicIndex for user ${userId}:`, err);
  }

  return { topic: selected, newIndex: nextIndex };
}

// ---------------------------------------------------------------------------
// Slot Occupancy Check
// ---------------------------------------------------------------------------

/**
 * Returns true if the user already has a DRAFT / SCHEDULED / PUBLISHED post
 * within 35 minutes of the target publishing slot UTC.
 *
 * The 35-minute window prevents duplicates even when the cron fires slightly
 * early or late due to Vercel scheduling variance.
 */
export async function checkSlotOccupied(
  userId: string,
  slotUtc: Date
): Promise<{ occupied: boolean; reason?: string }> {
  const windowMs = 35 * 60 * 1000;

  const snap = await adminDb
    .collection('content')
    .where('userId', '==', userId)
    .where('status', 'in', ['DRAFT', 'SCHEDULED', 'PUBLISHED'])
    .get();

  for (const docSnap of snap.docs) {
    const data = docSnap.data() as ContentItem;
    const scheduled = parseScheduledAt(data.scheduledAt);
    if (scheduled) {
      const diff = Math.abs(scheduled.getTime() - slotUtc.getTime());
      if (diff <= windowMs) {
        return {
          occupied: true,
          reason: `Post ${docSnap.id} (status=${data.status}, topic="${data.topic}") is within 35 min of slot ${slotUtc.toISOString()}`,
        };
      }
    }

    // Also guard against any post published TODAY (calendar day in IST)
    if (data.status === 'PUBLISHED' && data.publishedAt) {
      const pubIST = getDatePartsInTimezone(new Date(data.publishedAt), 'Asia/Kolkata');
      const slotIST = getDatePartsInTimezone(slotUtc, 'Asia/Kolkata');
      if (
        pubIST.year === slotIST.year &&
        pubIST.month === slotIST.month &&
        pubIST.day === slotIST.day
      ) {
        return {
          occupied: true,
          reason: `Post ${docSnap.id} was already published today (IST) at ${data.publishedAt}`,
        };
      }
    }
  }

  return { occupied: false };
}

// ---------------------------------------------------------------------------
// Concurrent Cron Protection
// ---------------------------------------------------------------------------

/**
 * Returns true if there is already a DRAFT post with a generationRunId created
 * today (IST date), indicating a concurrent cron invocation is mid-generation.
 */
export async function checkConcurrentGeneration(
  userId: string,
  slotUtc: Date
): Promise<boolean> {
  const slotIST = getDatePartsInTimezone(slotUtc, 'Asia/Kolkata');
  const todayPrefix = `${slotIST.year}-${String(slotIST.month).padStart(2, '0')}-${String(slotIST.day).padStart(2, '0')}`;

  const snap = await adminDb
    .collection('content')
    .where('userId', '==', userId)
    .where('status', '==', 'DRAFT')
    .get();

  for (const docSnap of snap.docs) {
    const data = docSnap.data() as ContentItem;
    if (data.generationRunId && data.createdAt?.startsWith(todayPrefix)) {
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Core Generation Pipeline
// ---------------------------------------------------------------------------

/**
 * Runs the complete content + infographic generation pipeline for one user.
 *
 * Steps:
 *  1. Research topic
 *  2. Generate content (Gemini -> curated fallback)
 *  3. Duplicate check against existing posts
 *  4. Generate SVG -> validate -> convert to PNG
 *  5. Full quality check (imageUrl present, no demo markers, etc.)
 *  6. Persist to Firestore as SCHEDULED (skipped in dry-run)
 */
export async function generateAndPersistPost(
  userId: string,
  topic: Topic,
  settings: UserSettings,
  existingPosts: ContentItem[],
  slotUtc: Date,
  dryRun: boolean
): Promise<AutoGenerationResult> {
  const topicName = topic.name;

  // 1. Research
  console.log(`[AutoGen] User ${userId}: Researching "${topicName}"`);
  const research = await performTopicResearch(topicName);

  // 2. AI Content Generation
  console.log(`[AutoGen] User ${userId}: Generating content for "${topicName}"`);
  const existingContext = existingPosts
    .filter((p) => p.status === 'PUBLISHED' || p.status === 'SCHEDULED')
    .map((p) => ({ hook: p.hook, body: p.body }));

  let generated;
  try {
    generated = await generateLinkedInPostContent(
      topicName,
      research,
      settings.writingStyle || 'Professional & Technical',
      settings.language || 'English',
      existingContext
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { generated: false, errorReason: `Content generation failed: ${msg}`, dryRun };
  }

  // 3. Duplicate content check
  const isDuplicate = existingPosts.some(
    (p) =>
      (p.status === 'PUBLISHED' || p.status === 'SCHEDULED') &&
      (p.hook.trim().toLowerCase() === generated.hook.trim().toLowerCase() ||
        p.body.trim().toLowerCase() === generated.body.trim().toLowerCase())
  );
  if (isDuplicate) {
    return {
      generated: false,
      skippedReason: 'Generated content duplicates an existing scheduled or published post.',
      dryRun,
    };
  }

  // 4. SVG Infographic Generation + Validation
  console.log(`[AutoGen] User ${userId}: Generating infographic for "${topicName}"`);
  let svgString: string;
  let pngBuffer: Buffer;

  try {
    svgString = generateTopicVisualSvg(topicName, generated.hook, generated.body);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { generated: false, errorReason: `SVG generation failed: ${msg}`, dryRun };
  }

  try {
    validateSvgOutput(svgString);
    validateSvgTextContent(svgString);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { generated: false, errorReason: `SVG validation failed: ${msg}`, dryRun };
  }

  try {
    pngBuffer = await convertSvgToPngBuffer(svgString);
    if (!pngBuffer || pngBuffer.length < 10000) {
      return {
        generated: false,
        errorReason: `PNG buffer too small (${pngBuffer?.length ?? 0} bytes) - infographic may be blank`,
        dryRun,
      };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { generated: false, errorReason: `SVG->PNG conversion failed: ${msg}`, dryRun };
  }

  // Encode SVG as data URL (consistent with manual creation flow)
  const imageUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

  // Build candidate ID and ContentItem
  const candidateId = `auto_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const finalPost: ContentItem = {
    id: candidateId,
    userId,
    topicId: topic.id,
    topic: topicName,
    hook: generated.hook,
    body: generated.body,
    cta: generated.cta,
    hashtags: generated.hashtags,
    imageUrl,
    sourceUrls: research.sourceUrls,
    status: 'SCHEDULED',
    scheduledAt: slotUtc.toISOString(),
    publishedAt: null,
    linkedinPostId: null,
    failureReason: null,
    generationRunId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 5. Full quality check (validates imageUrl presence, no cliches, no demo markers, etc.)
  const qualityResult = runQualityCheck(finalPost, existingPosts);
  if (!qualityResult.passed) {
    return {
      generated: false,
      errorReason: `Quality check failed: ${qualityResult.reason}`,
      dryRun,
    };
  }

  // 6. Persist (skipped in dry-run)
  if (dryRun) {
    console.log(`[AutoGen] DRY-RUN: User ${userId}: Would save "${topicName}" - skipping Firestore write`);
    return { generated: true, pngBuffer, dryRun };
  }

  const generationRunId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const persistablePost: ContentItem = { ...finalPost, generationRunId };

  try {
    await adminDb.collection('content').doc(persistablePost.id).set(persistablePost);
    console.log(
      `[AutoGen] Saved post ${persistablePost.id} topic="${topicName}" ` +
        `scheduledAt=${persistablePost.scheduledAt} generationRunId=${generationRunId}`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { generated: false, errorReason: `Firestore save failed: ${msg}`, dryRun };
  }

  return { generated: true, post: persistablePost, pngBuffer, dryRun };
}

// ---------------------------------------------------------------------------
// Per-User Entry Point
// ---------------------------------------------------------------------------

/**
 * Full Auto mode entry point for a single user.
 *
 * Validates prerequisites (LinkedIn connection, token expiry, enabled topics),
 * checks slot occupancy and concurrent generation, selects the next topic via
 * round-robin, then calls generateAndPersistPost.
 */
export async function runFullAutoForUser(
  userId: string,
  settings: UserSettings,
  connection: LinkedInConnection | null,
  dryRun: boolean
): Promise<FullAutoUserResult> {
  const tag = `[AutoGen:${userId.substring(0, 8)}]`;

  // Guard: LinkedIn connection
  if (!connection) {
    const r = 'LinkedIn not connected. Connect LinkedIn in Settings.';
    console.warn(`${tag} SKIPPED - ${r}`);
    return { userId, status: 'skipped', errorReason: r };
  }

  if (
    !connection.accessToken ||
    connection.accessToken.includes('mock') ||
    connection.accessToken.includes('demo')
  ) {
    const r = 'LinkedIn access token is missing or is a mock/demo token.';
    console.warn(`${tag} SKIPPED - ${r}`);
    return { userId, status: 'skipped', errorReason: r };
  }

  if (connection.expiresAt && new Date(connection.expiresAt) <= new Date()) {
    const r = `LinkedIn OAuth token expired at ${connection.expiresAt}. Reconnect in Settings.`;
    console.warn(`${tag} SKIPPED - ${r}`);
    return { userId, status: 'skipped', errorReason: r };
  }

  // Guard: Enabled topics
  const topicsSnap = await adminDb
    .collection('topics')
    .where('userId', '==', userId)
    .where('enabled', '==', true)
    .get();
  const enabledTopics: Topic[] = [];
  topicsSnap.forEach((d) => enabledTopics.push(d.data() as Topic));

  if (enabledTopics.length === 0) {
    const r = 'No enabled topics found. Enable at least one topic in Settings.';
    console.warn(`${tag} SKIPPED - ${r}`);
    return { userId, status: 'skipped', errorReason: r };
  }

  // Compute target publishing slot
  const now = new Date();
  const postingTime = settings.postingTime || '09:00';
  const timezone = settings.timezone || 'Asia/Kolkata';
  const slotIso = getNextScheduledSlot(now, postingTime, timezone);
  const slotUtc = new Date(slotIso);
  console.log(`${tag} Target slot: ${slotIso} (postingTime=${postingTime}, tz=${timezone})`);

  // Guard: Slot occupied
  const occupancy = await checkSlotOccupied(userId, slotUtc);
  if (occupancy.occupied) {
    console.log(`${tag} SKIPPED - slot occupied: ${occupancy.reason}`);
    return { userId, status: 'skipped', errorReason: `Slot occupied: ${occupancy.reason}` };
  }

  // Guard: Concurrent cron invocation
  const concurrent = await checkConcurrentGeneration(userId, slotUtc);
  if (concurrent) {
    const r = 'Concurrent cron invocation detected for this slot - skipping to avoid duplicate.';
    console.warn(`${tag} SKIPPED - ${r}`);
    return { userId, status: 'skipped', errorReason: r };
  }

  // Topic selection
  const allTopicsSnap = await adminDb.collection('topics').where('userId', '==', userId).get();
  const allTopics: Topic[] = [];
  allTopicsSnap.forEach((d) => allTopics.push(d.data() as Topic));

  const topicSelection = await selectNextTopic(userId, settings, allTopics);
  if (!topicSelection) {
    const r = 'No enabled topics available for selection.';
    console.warn(`${tag} SKIPPED - ${r}`);
    return { userId, status: 'skipped', errorReason: r };
  }
  console.log(`${tag} Selected topic: "${topicSelection.topic.name}"`);

  // Fetch existing posts for duplicate detection
  const existingSnap = await adminDb.collection('content').where('userId', '==', userId).get();
  const existingPosts: ContentItem[] = [];
  existingSnap.forEach((d) => existingPosts.push(d.data() as ContentItem));

  // Run generation pipeline
  const generationResult = await generateAndPersistPost(
    userId,
    topicSelection.topic,
    settings,
    existingPosts,
    slotUtc,
    dryRun
  );

  if (!generationResult.generated) {
    const r = generationResult.errorReason || generationResult.skippedReason || 'Generation failed';
    console.error(`${tag} FAILED - ${r}`);
    return { userId, status: 'failed', generationResult, errorReason: r };
  }

  const modeLabel = dryRun ? ' [DRY-RUN]' : '';
  console.log(
    `${tag}${modeLabel} GENERATED - topic="${topicSelection.topic.name}" postId=${generationResult.post?.id ?? 'dry-run'}`
  );
  return { userId, status: 'generated', generationResult };
}
