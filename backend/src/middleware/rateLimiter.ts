import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { cjsImport } from "../utils/cjsImport.js";

interface RateLimitOptions {
  windowMs?: number;
  limit?: number;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  message?: { error: string };
}

const rateLimit = cjsImport<(options: RateLimitOptions) => RequestHandler>("express-rate-limit");

/**
 * Portal-wide rate limiters — all use RATE_LIMIT_MAX (default 10,000 per window).
 */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: 1000000000, // 1 Billion (effectively unlimited)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, please try again later.",
  },
});

export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: 1000000000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
});

export const emailCheckLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: 1000000000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many email checks, please try again later.",
  },
});

export const contactLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: 1000000000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many inquiries submitted, please try again later.",
  },
});
