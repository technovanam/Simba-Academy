import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

/**
 * General API rate limiter.
 */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: process.env.NODE_ENV === "development" ? 100000 : env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, please try again later.",
  },
});

/**
 * Strict rate limiter for auth endpoints (login, register).
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
});

/**
 * Strict rate limiter for contact/inquiry endpoints.
 */
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5, // 5 inquiries per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many inquiries submitted, please try again later.",
  },
});
