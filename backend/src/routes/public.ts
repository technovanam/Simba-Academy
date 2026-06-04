import { Router } from "express";
import { prisma } from "../config/database.js";

const router = Router();

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

router.get("/books", async (_req, res, next) => {
  try {
    const books = await prisma.storyBook.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(books);
  } catch (err) {
    next(err);
  }
});

export default router;
