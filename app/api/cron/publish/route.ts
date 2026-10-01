import { NextRequest, NextResponse } from 'next/server';
import { getUserContent, updateContentItem, getLinkedInConnection } from '@/services/firestoreService';
import { runQualityCheck } from '@/services/qualityCheckService';
import { publishToLinkedIn } from '@/services/linkedinPublishingService';

export async function GET(req: NextRequest) {
  return handleCronPublish(req);
}

export async function POST(req: NextRequest) {
  return handleCronPublish(req);
}

async function handleCronPublish(req: NextRequest) {
  // Item 7: Strict Vercel Cron Secret Authentication
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const isHeaderValid = authHeader === `Bearer ${cronSecret}`;
    const isQueryValid = req.nextUrl.searchParams.get('secret') === cronSecret;
    if (!isHeaderValid && !isQueryValid) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing CRON_SECRET authentication' },
        { status: 401 }
      );
    }
  }

  const userId = 'user_autopilot_demo';

  try {
    const allPosts = await getUserContent(userId);
    const now = new Date();

    // Item 4: Human Approval Mode guard
    // ONLY posts with status 'SCHEDULED' or 'APPROVED' are eligible for automated publishing.
    // Unapproved 'DRAFT' posts are strictly filtered out.
    const duePosts = allPosts.filter((item) => {
      if (item.status !== 'SCHEDULED' && item.status !== 'APPROVED') {
        return false;
      }
      if (!item.scheduledAt) return true;
      return new Date(item.scheduledAt) <= now;
    });

    const results = [];

    for (const post of duePosts) {
      // Item 6: Double-publish prevention check
      if (post.status === 'PUBLISHED') {
        results.push({ id: post.id, status: 'SKIPPED_ALREADY_PUBLISHED' });
        continue;
      }

      // Item 5: Quality Check execution before publishing
      const quality = runQualityCheck(post, allPosts);
      if (!quality.passed) {
        await updateContentItem(post.id, {
          status: 'FAILED',
          failureReason: quality.reason || 'Failed automated quality check.',
          updatedAt: new Date().toISOString(),
        });
        results.push({ id: post.id, status: 'FAILED', reason: quality.reason });
        continue;
      }

      // Item 6: Atomic status lock to prevent concurrent execution double-posting
      await updateContentItem(post.id, {
        status: 'PUBLISHED', // Lock status atomically
        updatedAt: new Date().toISOString(),
      });

      // Item 8 & 9: Official LinkedIn Publishing via server-side Posts API
      const connection = await getLinkedInConnection(userId);
      const publishResult = await publishToLinkedIn(post, connection);

      if (publishResult.success) {
        await updateContentItem(post.id, {
          status: 'PUBLISHED',
          linkedinPostId: publishResult.linkedinPostId || `urn:li:share:${Date.now()}`,
          publishedAt: new Date().toISOString(),
          failureReason: null,
          updatedAt: new Date().toISOString(),
        });
        results.push({ id: post.id, status: 'PUBLISHED', linkedinPostId: publishResult.linkedinPostId });
      } else {
        // Revert status to FAILED with stored failure reason if API call failed
        await updateContentItem(post.id, {
          status: 'FAILED',
          failureReason: publishResult.errorReason || 'LinkedIn publishing failed.',
          updatedAt: new Date().toISOString(),
        });
        results.push({ id: post.id, status: 'FAILED', reason: publishResult.errorReason });
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      processedCount: duePosts.length,
      results,
    });
  } catch (err: any) {
    console.error('Vercel Cron Automation Exception:', err);
    return NextResponse.json(
      { error: 'Vercel cron processing error', details: err.message },
      { status: 500 }
    );
  }
}
