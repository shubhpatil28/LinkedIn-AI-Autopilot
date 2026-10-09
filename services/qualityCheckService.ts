import { ContentItem, QualityCheckResult } from '@/types';

export function runQualityCheck(item: ContentItem, allUserPosts: ContentItem[] = []): QualityCheckResult {
  if (!item) {
    return { passed: false, reason: 'Content item is missing or null.' };
  }

  if (!item.topic || item.topic.trim().length === 0) {
    return { passed: false, reason: 'Topic is missing or empty.' };
  }

  if (!item.hook || item.hook.trim().length === 0) {
    return { passed: false, reason: 'Hook is missing or empty.' };
  }

  if (!item.body || item.body.trim().length === 0) {
    return { passed: false, reason: 'Body content is missing or empty.' };
  }

  if (!item.cta || item.cta.trim().length === 0) {
    return { passed: false, reason: 'CTA (Call To Action) is missing or empty.' };
  }

  if (!item.hashtags || !Array.isArray(item.hashtags) || item.hashtags.length === 0) {
    return { passed: false, reason: 'Hashtags are missing or empty.' };
  }

  // 1. Enforce Hashtag Limit (Maximum 5 hashtags)
  if (item.hashtags.length > 5) {
    return { passed: false, reason: `Excessive hashtags detected (${item.hashtags.length}). Maximum allowed is 5 hashtags.` };
  }

  const combinedText = `${item.hook}\n${item.body}\n${item.cta}\n${item.hashtags.join(' ')}`;

  // 2. Reject Internal Demo / Scheduling Markers
  const forbiddenDemoPatterns = [
    /AUTOPILOT DEMO/i,
    /\[AUTOPILOT DEMO[^\]]*\]/i,
    /\[DEMO\]/i,
    /demo_post_/i,
    /This post was generated and scheduled by LinkedIn AI Autopilot at/i,
    /scheduledAt UTC:/i,
    /scheduledAt IST:/i,
  ];

  for (const pattern of forbiddenDemoPatterns) {
    if (pattern.test(combinedText)) {
      return { passed: false, reason: 'Contains forbidden internal demo or scheduling metadata in public post content.' };
    }
  }

  // 3. Reject Placeholders
  const forbiddenPlaceholders = [
    /lorem ipsum/i,
    /\bTODO\b/i,
    /\[INSERT/i,
    /<INSERT/i,
    /http:\/\/localhost/i,
  ];

  for (const pattern of forbiddenPlaceholders) {
    if (pattern.test(combinedText)) {
      return { passed: false, reason: 'Contains unpopulated placeholder or localhost URL.' };
    }
  }

  // 4. Reject Generic AI Clichés
  const forbiddenAiCliches = [
    /In today's fast-paced world/i,
    /In today's fast-paced digital/i,
    /Unlocking the power of/i,
  ];

  for (const pattern of forbiddenAiCliches) {
    if (pattern.test(combinedText)) {
      return { passed: false, reason: 'Contains generic AI cliché wording.' };
    }
  }

  if (!item.imageUrl || item.imageUrl.trim().length === 0) {
    return { passed: false, reason: 'Generated visual image URL is missing.' };
  }

  // 5. Duplicate Content Check: check if hook or body identical to already published posts
  const isDuplicate = allUserPosts.some(
    (existing) =>
      existing.id !== item.id &&
      (existing.status === 'PUBLISHED' || existing.status === 'SCHEDULED') &&
      (existing.hook.trim().toLowerCase() === item.hook.trim().toLowerCase() ||
        existing.body.trim().toLowerCase() === item.body.trim().toLowerCase())
  );

  if (isDuplicate) {
    return { passed: false, reason: 'Obvious duplicate content detected against existing scheduled/published posts.' };
  }

  return { passed: true };
}
