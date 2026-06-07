import "./instrument.js";
import { Sentry } from "./instrument.js";
import cors from "cors";
import type { ErrorRequestHandler, Express, RequestHandler } from "express";
import express from "express";
import jwt from "jsonwebtoken";
import helmet from "./utils/helmetMiddleware.js";
import morgan from "morgan";
import path from "node:path";
import { env } from "./config/env.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { AppError, ValidationError } from "./utils/errors.js";
import authRoutes from "./routes/auth.js";
import paymentRoutes from "./routes/payments.js";
import contactRoutes from "./routes/contact.js";
import storageRoutes from "./routes/storage.js";
import courseRoutes from "./routes/courses.js";
import adminRoutes from "./routes/admin.js";
import publicRoutes from "./routes/public.js";
import teacherRoutes from "./routes/teacher.js";
import libraryRoutes from "./routes/library.js";
import studentRoutes from "./routes/student.js";
import { prisma } from "./config/database.js";
import { ensureDefaultAdmin } from "./config/seedAdmin.js";

function isOriginAllowed(origin: string): boolean {
  if (env.ALLOWED_ORIGINS.includes(origin)) return true;
  if (env.ALLOW_VERCEL_PREVIEWS && origin.endsWith(".vercel.app")) return true;
  return false;
}

export const app: Express = express();
export const storagePath = path.resolve(env.STORAGE_PATH);

app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(new AppError(`Origin ${origin} not allowed by CORS`, 403));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", apiLimiter);

const uploadAccessGuard: RequestHandler = async (req, res, next) => {
  try {
    const fileUrl = `/uploads${req.path}`;
    const material = await prisma.material.findFirst({
      where: { fileUrl },
      select: { isApproved: true },
    });

    if (!material || material.isApproved) return next();

    const headerToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : undefined;
    const queryToken = typeof req.query.token === "string" ? req.query.token : undefined;
    const token = headerToken ?? queryToken;

    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { role?: string };
        if (decoded.role === "ADMIN" || decoded.role === "TEACHER") return next();
      } catch {
        // fall through to 403
      }
    }

    res.status(403).json({ error: "This material is pending approval" });
  } catch {
    next();
  }
};

app.use(
  "/uploads",
  uploadAccessGuard,
  express.static(storagePath, {
    maxAge: "1d",
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".pdf")) {
        res.setHeader("Content-Type", "application/pdf");
      } else if (filePath.endsWith(".ppt") || filePath.endsWith(".pptx")) {
        res.setHeader("Content-Type", "application/vnd.ms-powerpoint");
      }
    },
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/storage", storageRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/student", studentRoutes);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    platform: process.env.VERCEL ? "vercel" : "node",
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err instanceof ValidationError ? { errors: err.errors } : {}),
    });
    return;
  }

  if (err.type === "entity.too.large" || err.status === 413) {
    res.status(413).json({ error: "Payload too large" });
    return;
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({ error: "File too large" });
    return;
  }

  const prismaCode = (err as { code?: string }).code;
  if (prismaCode === "P2022") {
    res.status(500).json({
      error:
        "Database schema is out of date. Run: npx prisma db push on the server.",
    });
    return;
  }

  res.status(500).json({
    error: env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
};
app.use(errorHandler);

let initPromise: Promise<void> | undefined;

/** Seed admin once per serverless instance / before listen. */
export function initApp(): Promise<void> {
  if (!initPromise) {
    initPromise = ensureDefaultAdmin().catch((err) => {
      console.error("Failed to seed default admin:", err);
    });
  }
  return initPromise;
}
