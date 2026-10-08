import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { runQualityCheck } from '@/services/qualityCheckService';
import { publishToLinkedIn } from '@/services/linkedinPublishingService';
import { ContentItem, LinkedInConnection } from '@/types';

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

  try {
    const now = new Date();

    // FIX #1: Discover due posts across ALL users using Firebase Admin SDK (server-side).
    // No hardcoded userId — each post carries its own userId.
    const contentRef = adminDb.collection('content');
    const scheduledSnap = await contentRef
      .where('status', 'in', ['SCHEDULED', 'APPROVED'])
      .get();

    const allDuePosts: ContentItem[] = [];
    scheduledSnap.forEach((docSnap) => {
      const data = docSnap.data() as ContentItem;
      // Only include posts that are due (no scheduledAt or scheduledAt <= now)
      if (!data.scheduledAt || new Date(data.scheduledAt) <= now) {
        allDuePosts.push({ ...data, id: docSnap.id });
      }
    });

    console.log(`[CRON] Found ${allDuePosts.length} due posts to process at ${now.toISOString()}`);

    const results: Array<{
      id: string;
      userId: string;
      status: string;
      failureReason?: string;
      linkedinPostId?: string;
    }> = [];

    for (const post of allDuePosts) {
      // Validate post.userId exists
      if (!post.userId) {
        await adminDb.collection('content').doc(post.id).update({
          status: 'FAILED',
          failureReason: 'Post is missing userId. Cannot determine LinkedIn connection.',
          updatedAt: new Date().toISOString(),
        });
        console.error(`[CRON] Post ${post.id}: FAILED — missing userId`);
        results.push({ id: post.id, userId: '', status: 'FAILED', failureReason: 'Missing userId' });
        continue;
      }

      // Item 6: Double-publish prevention check
      if (post.status === 'PUBLISHED') {
        console.log(`[CRON] Post ${post.id}: SKIPPED — already published`);
        results.push({ id: post.id, userId: post.userId, status: 'SKIPPED_ALREADY_PUBLISHED' });
        continue;
      }

      // Item 5: Quality Check — fetch all user posts for duplicate detection
      const userContentSnap = await adminDb.collection('content')
        .where('userId', '==', post.userId)
        .get();
      const allUserPosts: ContentItem[] = [];
      userContentSnap.forEach((d) => allUserPosts.push(d.data() as ContentItem));

      const quality = runQualityCheck(post, allUserPosts);
      if (!quality.passed) {
        await adminDb.collection('content').doc(post.id).update({
          status: 'FAILED',
          failureReason: quality.reason || 'Failed automated quality check.',
          updatedAt: new Date().toISOString(),
        });
        console.warn(`[CRON] Post ${post.id}: FAILED quality check — ${quality.reason}`);
        results.push({ id: post.id, userId: post.userId, status: 'FAILED', failureReason: quality.reason });
        continue;
      }

      // FIX #1: Fetch LinkedIn connection using the post's own userId
      const connectionDoc = await adminDb.collection('linkedin_connections').doc(post.userId).get();
      const connection: LinkedInConnection | null = connectionDoc.exists
        ? (connectionDoc.data() as LinkedInConnection)
        : null;

      // FIX #5: Token expiration check
      if (connection && connection.expiresAt) {
        const expiresAt = new Date(connection.expiresAt);
        if (expiresAt <= now) {
          await adminDb.collection('content').doc(post.id).update({
            status: 'FAILED',
            failureReason: 'LinkedIn OAuth token expired. Reconnect LinkedIn in Settings.',
            updatedAt: new Date().toISOString(),
          });
          console.warn(`[CRON] Post ${post.id}: FAILED — LinkedIn token expired at ${connection.expiresAt}`);
          results.push({
            id: post.id,
            userId: post.userId,
            status: 'FAILED',
            failureReason: 'LinkedIn OAuth token expired. Reconnect LinkedIn in Settings.',
          });
          continue;
        }
      }

      // FIX #2: Do NOT publish if connection is missing/invalid — let publishToLinkedIn validate
      const publishResult = await publishToLinkedIn(post, connection);

      if (publishResult.success) {
        // Only mark PUBLISHED after LinkedIn confirms success
        await adminDb.collection('content').doc(post.id).update({
          status: 'PUBLISHED',
          linkedinPostId: publishResult.linkedinPostId || null,
          publishedAt: new Date().toISOString(),
          failureReason: null,
          updatedAt: new Date().toISOString(),
        });
        console.log(`[CRON] Post ${post.id}: PUBLISHED — linkedinPostId=${publishResult.linkedinPostId}`);
        results.push({
          id: post.id,
          userId: post.userId,
          status: 'PUBLISHED',
          linkedinPostId: publishResult.linkedinPostId,
        });
      } else {
        // Mark FAILED with useful reason
        await adminDb.collection('content').doc(post.id).update({
          status: 'FAILED',
          failureReason: publishResult.errorReason || 'LinkedIn publishing failed.',
          updatedAt: new Date().toISOString(),
        });
        console.error(`[CRON] Post ${post.id}: FAILED — ${publishResult.errorReason}`);
        results.push({
          id: post.id,
          userId: post.userId,
          status: 'FAILED',
          failureReason: publishResult.errorReason,
        });
      }
    }

    // FIX #3: Clear, structured cron response
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      processedCount: allDuePosts.length,
      results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[CRON] Vercel Cron Automation Exception:', message);
    return NextResponse.json(
      { error: 'Vercel cron processing error', details: message },
      { status: 500 }
    );
  }
}
