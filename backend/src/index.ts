import "dotenv/config";
import cors from "cors";
import type { ErrorRequestHandler, RequestHandler } from "express";
import express from "express";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import morgan from "morgan";
import path from "node:path";
import { env } from "./config/env.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { AppError, ValidationError } from "./utils/errors.js";

// ── Route Imports ───────────────────────────────────────────────────
import authRoutes from "./routes/auth.js";
import paymentRoutes from "./routes/payments.js";
import contactRoutes from "./routes/contact.js";
import storageRoutes from "./routes/storage.js";
import courseRoutes from "./routes/courses.js";
import adminRoutes from "./routes/admin.js";
import publicRoutes from "./routes/public.js";
import teacherRoutes from "./routes/teacher.js";
import libraryRoutes from "./routes/library.js";
import { prisma } from "./config/database.js";
import { ensureDefaultAdmin } from "./config/seedAdmin.js";


const app = express();
const PORT = env.PORT;

// ── Trust Proxy ──────────────────────────────────────────────────────
app.set("trust proxy", 1);

// ── Security Middleware ──────────────────────────────────────────────
// Allow the frontend (served from a different origin) to load uploaded
// images/PDFs from /uploads — helmet's default CORP is same-origin.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      const allowed = env.ALLOWED_ORIGINS;
      if (allowed.includes(origin)) {
        return callback(null, true);
      }
      return callback(new AppError(`Origin ${origin} not allowed by CORS`, 403));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Rate Limiting ────────────────────────────────────────────────────
app.use("/api", apiLimiter);

// ── Static Files (Uploaded PPT/PDF) ─────────────────────────────────
const storagePath = path.resolve(env.STORAGE_PATH);

// Gate direct access to files that back an unapproved Material. Approved files
// and non-material assets (gallery/course images, raw uploads) stay public.
// Admin/Teacher previews can pass a JWT via Authorization header or ?token=.
const uploadAccessGuard: RequestHandler = async (req, res, next) => {
  try {
    // req.path is "/<filename>"; stored fileUrl is "/uploads/<filename>".
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
    // On any lookup error, fail open to normal static handling.
    next();
  }
};

app.use("/uploads", uploadAccessGuard, express.static(storagePath, {
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
}));

// ── API Routes ───────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/storage", storageRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/library", libraryRoutes);


// ── Health Check ─────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
  });
});

// ── 404 Handler ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global Error Handler ─────────────────────────────────────────────
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: err.message,
        ...(err instanceof ValidationError ? { errors: err.errors } : {}),
      });
      return;
    }

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({ error: "File too large" });
    return;
  }

  // Prisma: DB columns out of sync with schema (e.g. after Zoho migration)
  const prismaCode = (err as { code?: string }).code;
  if (prismaCode === "P2022") {
    res.status(500).json({
      error:
        "Database schema is out of date. On the server run: npm run db:migrate-payments (or apply scripts/rename-payment-columns.sql).",
    });
    return;
  }

  res.status(500).json({
    error: env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
};
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────────────
async function startServer() {
  try {
    await ensureDefaultAdmin();
  } catch (err) {
    console.error("Failed to seed default admin:", err);
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 Simba Academy API running at http://localhost:${PORT}`);
    console.log(`🌐 Environment: ${env.NODE_ENV}`);
    console.log(`📁 Storage: ${storagePath}`);
    console.log(`✅ Allowed origins: ${env.ALLOWED_ORIGINS.join(", ")}`);
  });

  // ── Graceful Shutdown ────────────────────────────────────────────────
  const shutdown = (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer();
