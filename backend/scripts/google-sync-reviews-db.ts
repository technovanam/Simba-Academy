/**
 * CLI runner: pull all Google Business reviews and upsert to database
 * Run via: npm run google:sync-reviews-db
 */
import "dotenv/config";
import { syncGoogleBusinessReviews } from "../src/services/gbpSyncService.ts";

async function run() {
  console.info("Starting Google Business Profile reviews DB sync via CLI...");
  const result = await syncGoogleBusinessReviews();
  if (result.success) {
    console.info(`Sync complete. Synced ${result.syncedCount} reviews across ${result.locationsSynced} locations.`);
    process.exit(0);
  } else {
    console.error(`Sync failed: ${result.error}`);
    process.exit(1);
  }
}

run();
