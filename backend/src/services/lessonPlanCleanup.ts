import { prisma } from "../config/database.js";
import { removeStoredFile } from "./removeStoredFile.js";

// Cleanup lesson plan files older than 1 week (7 days)
export async function cleanupExpiredLessonPlanFiles(): Promise<void> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    const expiredPlans = await prisma.lessonPlan.findMany({
      where: {
        fileUrl: { not: null },
        updatedAt: { lt: oneWeekAgo },
      },
      select: {
        id: true,
        title: true,
        fileUrl: true,
      },
    });

    if (expiredPlans.length === 0) {
      return;
    }

    console.info(`[LessonPlan Cleanup] Found ${expiredPlans.length} expired lesson plan file(s) to delete.`);

    for (const plan of expiredPlans) {
      if (plan.fileUrl) {
        try {
          console.info(`[LessonPlan Cleanup] Deleting file: ${plan.fileUrl} for plan: "${plan.title}" (${plan.id})`);
          await removeStoredFile(plan.fileUrl);
        } catch (storageErr) {
          console.error(`[LessonPlan Cleanup] Error removing stored file "${plan.fileUrl}":`, storageErr);
        }
      }

      try {
        await prisma.lessonPlan.update({
          where: { id: plan.id },
          data: { fileUrl: null, fileName: null },
        });
        console.info(`[LessonPlan Cleanup] Database record updated: removed file attachments for plan "${plan.title}" (${plan.id}).`);
      } catch (dbErr) {
        console.error(`[LessonPlan Cleanup] Error updating database record for plan ${plan.id}:`, dbErr);
      }
    }
  } catch (err) {
    console.error("[LessonPlan Cleanup] Critical error during cleanup run:", err);
  }
}

let cleanupInterval: NodeJS.Timeout | null = null;
const CLEANUP_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours
const STARTUP_DELAY_MS = 5000; // 5 seconds delay on startup

export function startLessonPlanCleanupScheduler(): void {
  if (cleanupInterval) {
    console.log("[LessonPlan Scheduler] Cleanup scheduler is already running.");
    return;
  }

  console.log("[LessonPlan Scheduler] Initializing lesson plan files background cleanup scheduler (every 12 hours).");

  // Run once shortly after startup
  setTimeout(async () => {
    try {
      console.log("[LessonPlan Scheduler] Running startup expired lesson plan files cleanup...");
      await cleanupExpiredLessonPlanFiles();
      console.log("[LessonPlan Scheduler] Startup cleanup finished.");
    } catch (err) {
      console.error("[LessonPlan Scheduler] Startup cleanup failed:", err);
    }
  }, STARTUP_DELAY_MS);

  // Set recurring interval
  cleanupInterval = setInterval(async () => {
    try {
      console.log("[LessonPlan Scheduler] Running scheduled expired lesson plan files cleanup...");
      await cleanupExpiredLessonPlanFiles();
      console.log("[LessonPlan Scheduler] Scheduled cleanup finished.");
    } catch (err) {
      console.error("[LessonPlan Scheduler] Scheduled cleanup failed:", err);
    }
  }, CLEANUP_INTERVAL_MS);
}
