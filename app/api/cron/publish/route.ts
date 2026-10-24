import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { runQualityCheck } from "@/services/qualityCheckService";
import { publishToLinkedIn } from "@/services/linkedinPublishingService";
import { parseScheduledAt, getDatePartsInTimezone } from "@/lib/scheduling";
import { runFullAutoForUser } from "@/services/autoGenerationService";
import { ContentItem, LinkedInConnection, UserSettings } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return handleCronPublish(req);
}

export async function POST(req: NextRequest) {
  return handleCronPublish(req);
}

async function handleCronPublish(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const isHeaderValid = authHeader === `Bearer ${cronSecret}`;
    const isQueryValid = req.nextUrl.searchParams.get("secret") === cronSecret;
    if (!isHeaderValid && !isQueryValid) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing CRON_SECRET authentication" },
        { status: 401 }
      );
    }
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "true";
  if (dryRun) {
    console.log("[CRON] DRY-RUN mode enabled — no Firestore writes or LinkedIn publishes");
  }

  try {
    const now = new Date();
    const nowIST = getDatePartsInTimezone(now, "Asia/Kolkata");
    console.log(
      `[CRON] Current time — UTC: ${now.toISOString()}, IST: ${nowIST.year}-${String(nowIST.month).padStart(2, "0")}-${String(nowIST.day).padStart(2, "0")} ${String(nowIST.hour).padStart(2, "0")}:${String(nowIST.minute).padStart(2, "0")}:${String(nowIST.second).padStart(2, "0")}`
    );

    const autoGenResults: Array<{
      userId: string;
      status: string;
      postId?: string;
      reason?: string;
    }> = [];

    try {
      console.log("[CRON] Phase 0: Fetching Full Auto users...");
      const settingsSnap = await adminDb
        .collection("settings")
        .where("publishingMode", "==", "Full Auto")
        .get();

      const fullAutoUsers: UserSettings[] = [];
      settingsSnap.forEach((d) => fullAutoUsers.push(d.data() as UserSettings));
      console.log(`[CRON] Phase 0: Found ${fullAutoUsers.length} Full Auto user(s)`);

      for (const userSettings of fullAutoUsers) {
        const userId = userSettings.userId;
        if (!userId) {
          console.warn("[CRON] Phase 0: Settings doc missing userId — skipping");
          continue;
        }

        let connection: LinkedInConnection | null = null;
        try {
          const connDoc = await adminDb.collection("linkedin_connections").doc(userId).get();
          if (connDoc.exists) {
            connection = connDoc.data() as LinkedInConnection;
          }
        } catch (connErr) {
          console.warn(`[CRON] Phase 0: Failed to fetch LinkedIn connection for user ${userId}:`, connErr);
        }

        try {
          const result = await runFullAutoForUser(userId, userSettings, connection, dryRun);
          autoGenResults.push({
            userId,
            status: result.status,
            postId: result.generationResult?.post?.id,
            reason: result.errorReason,
          });

          if (result.status === "generated") {
            console.log(
              `[CRON] Phase 0: ${dryRun ? "[DRY-RUN] " : ""}Generated post for user ${userId} — postId=${result.generationResult?.post?.id ?? "dry-run"}`
            );
          } else if (result.status === "skipped") {
            console.log(`[CRON] Phase 0: Skipped user ${userId} — ${result.errorReason}`);
          } else {
            console.error(`[CRON] Phase 0: Failed for user ${userId} — ${result.errorReason}`);
          }
        } catch (userErr) {
          const msg = userErr instanceof Error ? userErr.message : String(userErr);
          console.error(`[CRON] Phase 0: Unhandled error for user ${userId}:`, msg);
          autoGenResults.push({ userId, status: "error", reason: msg });
        }
      }
    } catch (phase0Err) {
      const msg = phase0Err instanceof Error ? phase0Err.message : String(phase0Err);
      console.error("[CRON] Phase 0: Unexpected error (continuing to Phase 1):", msg);
      autoGenResults.push({ userId: "PHASE_0_FATAL", status: "error", reason: msg });
    }

    console.log(
      `[CRON] Phase 0 complete — generated=${autoGenResults.filter((r) => r.status === "generated").length}, skipped=${autoGenResults.filter((r) => r.status === "skipped").length}, failed=${autoGenResults.filter((r) => r.status === "failed" || r.status === "error").length}`
    );

    const contentRef = adminDb.collection("content");
    const scheduledSnap = await contentRef.where("status", "in", ["SCHEDULED", "APPROVED"]).get();

    const allDuePosts: ContentItem[] = [];
    scheduledSnap.forEach((docSnap) => {
      const data = docSnap.data() as ContentItem;
      const scheduledDate = parseScheduledAt(data.scheduledAt);
      if (!scheduledDate || scheduledDate.getTime() <= now.getTime()) {
        console.log(
          `[CRON] Phase 1: Post ${docSnap.id}: Discovered eligible — status=${data.status}, topic="${data.topic || "unknown"}", scheduledAt=${data.scheduledAt}`
        );
        allDuePosts.push({ ...data, id: docSnap.id });
      } else {
        const schedIST = getDatePartsInTimezone(scheduledDate, "Asia/Kolkata");
        console.log(
          `[CRON] Phase 1: Post ${docSnap.id}: not yet due — scheduledAt UTC: ${scheduledDate.toISOString()}, IST: ${String(schedIST.hour).padStart(2, "0")}:${String(schedIST.minute).padStart(2, "0")}`
        );
      }
    });

    console.log(`[CRON] Phase 1: Found ${allDuePosts.length} due posts to process`);

    const results: Array<{
      id: string;
      userId: string;
      topic?: string;
      status: string;
      failureReason?: string;
      linkedinPostId?: string;
    }> = [];

    for (const post of allDuePosts) {
      if (!post.userId) {
        if (!dryRun) {
          await adminDb.collection("content").doc(post.id).update({
            status: "FAILED",
            failureReason: "Post is missing userId. Cannot determine LinkedIn connection.",
            updatedAt: new Date().toISOString(),
          });
        }
        console.error(`[CRON] Post ${post.id}: FAILED — missing userId in post record`);
        results.push({ id: post.id, userId: "", topic: post.topic, status: "FAILED", failureReason: "Missing userId" });
        continue;
      }

      if (post.status === "PUBLISHED") {
        console.log(`[CRON] Post ${post.id}: SKIPPED — already published`);
        results.push({ id: post.id, userId: post.userId, topic: post.topic, status: "SKIPPED_ALREADY_PUBLISHED" });
        continue;
      }

      const userContentSnap = await adminDb.collection("content").where("userId", "==", post.userId).get();
      const allUserPosts: ContentItem[] = [];
      userContentSnap.forEach((d) => allUserPosts.push(d.data() as ContentItem));

      const quality = runQualityCheck(post, allUserPosts);
      if (!quality.passed) {
        if (!dryRun) {
          await adminDb.collection("content").doc(post.id).update({
            status: "FAILED",
            failureReason: quality.reason || "Failed automated quality check.",
            updatedAt: new Date().toISOString(),
          });
        }
        console.warn(`[CRON] Post ${post.id}: REJECTED by quality guardrail — reason="${quality.reason}"`);
        results.push({ id: post.id, userId: post.userId, topic: post.topic, status: "FAILED", failureReason: quality.reason });
        continue;
      }

      const connectionDoc = await adminDb.collection("linkedin_connections").doc(post.userId).get();
      const connection: LinkedInConnection | null = connectionDoc.exists ? (connectionDoc.data() as LinkedInConnection) : null;

      if (connection && (connection as any).userId && (connection as any).userId !== post.userId) {
        if (!dryRun) {
          await adminDb.collection("content").doc(post.id).update({
            status: "FAILED",
            failureReason: `LinkedIn connection userId mismatch`,
            updatedAt: new Date().toISOString(),
          });
        }
        results.push({ id: post.id, userId: post.userId, topic: post.topic, status: "FAILED", failureReason: "LinkedIn connection userId mismatch" });
        continue;
      }

      if (connection && connection.expiresAt) {
        const expiresAt = new Date(connection.expiresAt);
        if (expiresAt <= now) {
          if (!dryRun) {
            await adminDb.collection("content").doc(post.id).update({
              status: "FAILED",
              failureReason: "LinkedIn OAuth token expired. Reconnect LinkedIn in Settings.",
              updatedAt: new Date().toISOString(),
            });
          }
          results.push({ id: post.id, userId: post.userId, topic: post.topic, status: "FAILED", failureReason: "LinkedIn OAuth token expired" });
          continue;
        }
      }

      if (dryRun) {
        console.log(`[CRON] DRY-RUN: Would publish post ${post.id} — skipping`);
        results.push({ id: post.id, userId: post.userId, topic: post.topic, status: "DRY_RUN_SKIPPED" });
        continue;
      }

      const publishResult = await publishToLinkedIn(post, connection);

      if (publishResult.success) {
        await adminDb.collection("content").doc(post.id).update({
          status: "PUBLISHED",
          linkedinPostId: publishResult.linkedinPostId || null,
          publishedAt: new Date().toISOString(),
          failureReason: null,
          updatedAt: new Date().toISOString(),
        });
        results.push({ id: post.id, userId: post.userId, topic: post.topic, status: "PUBLISHED", linkedinPostId: publishResult.linkedinPostId });
      } else {
        await adminDb.collection("content").doc(post.id).update({
          status: "FAILED",
          failureReason: publishResult.errorReason || "LinkedIn publishing failed.",
          updatedAt: new Date().toISOString(),
        });
        results.push({ id: post.id, userId: post.userId, topic: post.topic, status: "FAILED", failureReason: publishResult.errorReason });
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      dryRun,
      phase0: {
        fullAutoUsersProcessed: autoGenResults.length,
        generated: autoGenResults.filter((r) => r.status === "generated").length,
        skipped: autoGenResults.filter((r) => r.status === "skipped").length,
        failed: autoGenResults.filter((r) => r.status === "failed" || r.status === "error").length,
        details: autoGenResults,
      },
      phase1: {
        processedCount: allDuePosts.length,
        results,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[CRON] Vercel Cron Automation Exception:", message);
    return NextResponse.json({ error: "Vercel cron processing error", details: message }, { status: 500 });
  }
}
