import "dotenv/config.js";
import { env } from "./config/env.js";
import { prisma } from "./config/database.js";
import { app, initApp, storagePath } from "./app.js";
import { startGbpSyncScheduler } from "./services/gbpSyncService.js";
import { startLessonPlanCleanupScheduler } from "./services/lessonPlanCleanup.js";
import { initRecurringTasksCron } from "./services/recurringTasks.js";
import { startOverdueTaskNotifier } from "./services/overdueTaskNotifier.js";

const PORT = process.env.PORT || env.PORT;

async function startServer() {
  await initApp();
  startGbpSyncScheduler();
  startLessonPlanCleanupScheduler();
  initRecurringTasksCron();
  startOverdueTaskNotifier();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Simba Academy API running at http://localhost:${PORT}`);
    console.log(`🌐 Environment: ${env.NODE_ENV}`);
    console.log(`📁 Storage: ${storagePath}`);
    console.log(`✅ Allowed origins: ${env.ALLOWED_ORIGINS.join(", ")}`);
  });

  const shutdown = (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer();
