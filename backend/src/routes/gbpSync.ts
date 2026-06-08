import { Router } from "express";
import { syncGoogleBusinessReviews } from "../services/gbpSyncService.js";
import { prisma } from "../config/database.js";

const router = Router();

/**
 * POST /api/admin/gbp-sync/batch-sync
 * Trigger the GBP batch review sync pipeline manually
 */
router.post("/batch-sync", async (_req, res, next) => {
  try {
    const syncResult = await syncGoogleBusinessReviews();
    if (!syncResult.success) {
      return res.status(500).json({
        error: "Google Business Profile synchronization failed",
        details: syncResult.error,
      });
    }
    res.json(syncResult);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/gbp-sync/reviews
 * Retrieve all synchronized Google reviews from the database
 */
router.get("/reviews", async (_req, res, next) => {
  try {
    const reviews = await prisma.googleReview.findMany({
      orderBy: { updateTime: "desc" },
    });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

export default router;
