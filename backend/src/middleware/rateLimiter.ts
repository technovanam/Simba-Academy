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
  limit: process.env.NODE_ENV === "development" ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
});

/**
 * Strict rate limiter for contact/inquiry endpoints.
 */
/** Email availability checks — prevent enumeration spam */
export const emailCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "development" ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many email checks, please try again later.",
  },
});

export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: process.env.NODE_ENV === "development" ? 1000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many inquiries submitted, please try again later.",
  },
});
