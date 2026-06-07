/**
 * Show manual testimonials + Places API reviews (works when Business API is rate-limited).
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../src/config/database.ts";

const SNAPSHOT = path.resolve("data/google-reviews-snapshot.json");
const placeIds = (process.env.GOOGLE_PLACE_IDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const apiKey = process.env.GOOGLE_PLACES_API_KEY ?? "";

async function fetchPlacesNewReviews(placeId) {
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "displayName,rating,userRatingCount,reviews",
    },
  });
  const body = await res.json();
  if (!res.ok) {
    return { placeId, error: body.error?.message ?? `HTTP ${res.status}` };
  }
  const reviews = (body.reviews ?? [])
    .filter((r) => (r.text?.text ?? "").trim())
    .map((r) => ({
      name: r.authorAttribution?.displayName ?? "Google User",
      rating: r.rating ?? 5,
      content: r.text.text.trim(),
      relativeTime: r.relativePublishTimeDescription,
    }));
  return {
    placeId,
    placeName: body.displayName?.text ?? placeId,
    rating: body.rating,
    totalRatings: body.userRatingCount,
    reviews,
  };
}

const manual = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } });

let snapshot = null;
if (fs.existsSync(SNAPSHOT)) {
  snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, "utf8"));
}

const places = [];
for (const id of placeIds) {
  places.push(await fetchPlacesNewReviews(id));
  await new Promise((r) => setTimeout(r, 300));
}

const allGoogle = places.flatMap((p) => p.reviews ?? []);

console.log(
  JSON.stringify(
    {
      summary: {
        savedSnapshotCount: snapshot?.reviews?.length ?? 0,
        savedSnapshotAt: snapshot?.syncedAt ?? null,
        manualTestimonialCount: manual.length,
        placesApiReviewCount: allGoogle.length,
        businessApiNote:
          "Google Business API is rate-limited (~16 min left). Places API used for this report.",
      },
      savedSnapshotReviews: (snapshot?.reviews ?? []).map((r) => ({
        name: r.name,
        rating: r.rating,
        content: r.content,
        placeName: r.placeName,
      })),
      manualTestimonials: manual.map((t) => ({
        name: t.name,
        rating: t.rating,
        content: t.content,
        published: t.isApproved,
      })),
      placesByLocation: places.map((p) => ({
        placeName: p.placeName ?? p.placeId,
        rating: p.rating,
        totalRatings: p.totalRatings,
        error: p.error,
        reviews: (p.reviews ?? []).map((r) => ({
          name: r.name,
          rating: r.rating,
          content: r.content,
          relativeTime: r.relativeTime,
        })),
      })),
    },
    null,
    2
  )
);

await prisma.$disconnect();
