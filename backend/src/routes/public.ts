import { Router } from "express";
import { prisma } from "../config/database.js";
import reviewRoutes from "./reviews.js";

const router = Router();

router.use("/reviews", reviewRoutes);

router.get("/gallery", async (_req, res, next) => {
  try {
    const items = await prisma.gallery.findMany({
      where: { isActive: true, type: "IMAGE" },
      orderBy: { createdAt: "desc" },
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.get("/testimonials", async (_req, res, next) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(testimonials);
  } catch (err) {
    next(err);
  }
});

/** @deprecated Use GET /api/library/storybooks (authenticated, role-filtered). */
router.get("/books", async (_req, res, next) => {
  try {
    const books = await prisma.storyBook.findMany({
      where: { audience: { in: ["STUDENT", "BOTH"] } },
      orderBy: { createdAt: "desc" },
    });
    res.json(books);
  } catch (err) {
    next(err);
  }
});

export default router;
