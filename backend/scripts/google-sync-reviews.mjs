/**
 * One-time sync: pull all Google Business reviews and save to data/google-reviews-snapshot.json
 * Run when rate limit has cleared: npm run google:sync-reviews
 */
import "dotenv/config";
import { fetchGooglePlaceReviews } from "../src/services/googleReviews.ts";

const meta = {};
const result = await fetchGooglePlaceReviews(true, meta);
const withText = result.reviews.filter((r) => r.content && r.content !== "—");
console.log(
  JSON.stringify(
    {
      fetchMode: result.fetchMode,
      locations: result.locations.length,
      total: result.reviews.length,
      withWrittenFeedback: withText.length,
      syncedAt: meta.syncedAt,
      blocked: meta.syncBlocked,
    },
    null,
    2
  )
);
if (meta.syncBlocked) {
  console.error("\nNote:", meta.syncBlocked);
  process.exit(meta.fromSnapshot ? 0 : 1);
}
