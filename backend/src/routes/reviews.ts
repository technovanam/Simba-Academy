import { Router } from "express";
import type { Testimonial } from "@prisma/client";
import { prisma } from "../config/database.js";
import { isGoogleReviewsConfigured } from "../services/googleReviews.js";

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

    const googleDbReviews = await prisma.googleReview.findMany({
      orderBy: { updateTime: "desc" },
    });

    const googleReviews: PublicReviewDto[] = googleDbReviews.map((r) => ({
      id: r.reviewId,
      name: r.reviewerName,
      content: r.comment,
      rating: r.rating,
      source: "google" as const,
      relativeTime: r.updateTime.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      profilePhotoUrl: r.reviewerPhotoUrl || undefined,
      placeName: "Simba Preschool",
      placeId: r.locationId,
    }));

    const manualReviews: PublicReviewDto[] = manual.map((t: Testimonial) => ({
      id: t.id,
      name: t.name,
      content: t.content,
      rating: t.rating,
      source: "manual" as const,
    }));

    const reviews = [...googleReviews, ...manualReviews];

    const googleCount = googleDbReviews.length;
    const avgRating = googleCount > 0
      ? Math.round((googleDbReviews.reduce((sum, r) => sum + r.rating, 0) / googleCount) * 10) / 10
      : 5;

    const uniqueLocations = Array.from(new Set(googleDbReviews.map((r) => r.locationId)));
    const locations = uniqueLocations.map((locId) => ({
      placeId: locId,
      placeName: `Simba Preschool (${locId})`,
      rating: avgRating,
      totalRatings: googleCount,
      reviewsReturned: googleDbReviews.filter((r) => r.locationId === locId).length,
    }));

    const latestReview = await prisma.googleReview.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });
    const fetchedAt = latestReview?.updatedAt.toISOString();

    res.json({
      reviews,
      google: {
        configured: isGoogleReviewsConfigured(),
        fetchMode: "business_profile",
        rating: avgRating,
        totalRatings: googleCount || undefined,
        placeName: "Simba Preschool",
        count: googleReviews.length,
        locationCount: uniqueLocations.length,
        locations,
        fetchedAt,
        fromSnapshot: false,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/google", async (_req, res, next) => {
  try {
    const googleDbReviews = await prisma.googleReview.findMany({
      orderBy: { updateTime: "desc" },
    });
    
    const count = googleDbReviews.length;
    const avgRating = count > 0
      ? Math.round((googleDbReviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
      : 5;

    const uniqueLocations = Array.from(new Set(googleDbReviews.map((r) => r.locationId)));
    const locations = uniqueLocations.map((locId) => ({
      placeId: locId,
      placeName: `Simba Preschool (${locId})`,
      rating: avgRating,
      totalRatings: count,
      reviewsReturned: googleDbReviews.filter((r) => r.locationId === locId).length,
    }));

    res.json({
      reviews: googleDbReviews,
      locations,
      rating: avgRating,
      totalRatings: count,
      configured: isGoogleReviewsConfigured(),
      fetchMode: "business_profile",
    });
  } catch (err) {
    next(err);
  }
});

export default router;

