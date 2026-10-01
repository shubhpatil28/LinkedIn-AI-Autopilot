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

  if (!item.imageUrl || item.imageUrl.trim().length === 0) {
    return { passed: false, reason: 'Generated visual image URL is missing.' };
  }

  // Duplicate Content Check: check if hook or body identical to already published posts
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
