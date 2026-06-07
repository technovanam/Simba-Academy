import { Router } from "express";
import type { Testimonial } from "@prisma/client";
import { prisma } from "../config/database.js";
import { fetchGooglePlaceReviews, isGoogleReviewsConfigured } from "../services/googleReviews.js";

const router = Router();

export type PublicReviewSource = "google" | "manual";

export interface PublicReviewDto {
  id: string;
  name: string;
  content: string;
  rating: number;
  source: PublicReviewSource;
  relativeTime?: string;
  profilePhotoUrl?: string;
  placeName?: string;
  placeId?: string;
}

/**
 * Combined reviews: all Google Business locations + approved manual testimonials.
 */
router.get("/", async (_req, res, next) => {
  try {
    const manual = await prisma.testimonial.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: "desc" },
    });

    let googleResult: Awaited<ReturnType<typeof fetchGooglePlaceReviews>> = {
      reviews: [],
      locations: [],
      configured: false,
      fetchMode: "none",
    };
    const googleMeta: { fetchedAt?: string; fromSnapshot?: boolean } = {};
    if (isGoogleReviewsConfigured()) {
      try {
        googleResult = await fetchGooglePlaceReviews(false, googleMeta);
      } catch (err) {
        console.error("Google reviews fetch failed:", err);
        googleResult = { reviews: [], locations: [], configured: true, fetchMode: "none" };
      }
    }

    const googleReviews: PublicReviewDto[] = googleResult.reviews.map((r) => ({
      id: r.id,
      name: r.name,
      content: r.content,
      rating: r.rating,
      source: "google" as const,
      relativeTime: r.relativeTime,
      profilePhotoUrl: r.profilePhotoUrl,
      placeName: r.placeName,
      placeId: r.placeId,
    }));

    const manualReviews: PublicReviewDto[] = manual.map((t: Testimonial) => ({
      id: t.id,
      name: t.name,
      content: t.content,
      rating: t.rating,
      source: "manual" as const,
    }));

    const reviews = [...googleReviews, ...manualReviews];

    res.json({
      reviews,
      google: {
        configured: googleResult.configured,
        fetchMode: googleResult.fetchMode,
        rating: googleResult.rating,
        totalRatings: googleResult.totalRatings,
        placeName: googleResult.placeName,
        count: googleReviews.length,
        locationCount: googleResult.locations.length,
        locations: googleResult.locations,
        fetchedAt: googleMeta.fetchedAt,
        fromSnapshot: googleMeta.fromSnapshot,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/google", async (_req, res, next) => {
  try {
    const result = await fetchGooglePlaceReviews();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
