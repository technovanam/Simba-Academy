import { existsSync } from "node:fs";
import path from "node:path";
import { Router } from "express";
import { env } from "../config/env.js";
import { prisma } from "../config/database.js";

const storagePath = path.resolve(env.STORAGE_PATH);

export interface HealthStatus {
  status: "ok" | "degraded";
  timestamp: string;
  uptime: number;
  environment: string;
  platform: string;
  checks: {
    database: { ok: boolean; message: string };
    storage: { ok: boolean; message: string; path: string };
    payments: { ok: boolean; message: string };
  };
}

export async function getHealthStatus(): Promise<HealthStatus> {
  let dbOk = false;
  let dbMessage = "Disconnected";

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
    dbMessage = "Connected";
  } catch (err) {
    dbMessage = err instanceof Error ? err.message : "Database check failed";
  }

  const storageOk = existsSync(storagePath);
  const paymentsOk = env.PAYMENTS_ENABLED && !env.ZOHO_PAYMENTS_PLACEHOLDER;

  const checks = {
    database: { ok: dbOk, message: dbMessage },
    storage: {
      ok: storageOk,
      message: storageOk ? "Uploads folder ready" : "Uploads folder missing",
      path: storagePath,
    },
    payments: {
      ok: paymentsOk,
      message: paymentsOk
        ? "Zoho Payments live"
        : env.PAYMENTS_ENABLED
          ? "Payments in placeholder/mock mode"
          : "Payments disabled",
    },
  };

  const allOk = dbOk && storageOk;

  return {
    status: allOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    platform: "cpanel",
    checks,
  };
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function checkRow(label: string, ok: boolean, detail: string): string {
  const icon = ok ? "✓" : "✗";
  const color = ok ? "#8AC926" : "#ef4444";
  return `
    <div class="check">
      <span class="check-icon" style="color:${color}">${icon}</span>
      <div>
        <strong>${label}</strong>
        <p>${detail}</p>
      </div>
    </div>`;
}

export function renderHealthPage(data: HealthStatus): string {
  const isOk = data.status === "ok";
  const badge = isOk ? "All systems operational" : "Some checks need attention";
  const badgeColor = isOk ? "#8AC926" : "#FF9F1C";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Simba Academy API — Status</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: linear-gradient(135deg, #f0fdf4 0%, #fff7ed 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      color: #1e293b;
    }
    .card {
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,.08);
      max-width: 520px;
      width: 100%;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #8AC926, #6aa81e);
      color: #fff;
      padding: 28px 28px 24px;
    }
    .header h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 4px; }
    .header p { opacity: .9; font-size: .9rem; }
    .badge {
      display: inline-block;
      margin-top: 14px;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: .8rem;
      font-weight: 700;
      background: ${badgeColor};
      color: #fff;
    }
    .body { padding: 24px 28px 28px; }
    .check {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 14px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .check:last-child { border-bottom: none; }
    .check-icon { font-size: 1.25rem; font-weight: 900; line-height: 1.4; }
    .check strong { display: block; font-size: .95rem; margin-bottom: 2px; }
    .check p { font-size: .82rem; color: #64748b; word-break: break-all; }
    .meta {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
      font-size: .78rem;
      color: #94a3b8;
      line-height: 1.7;
    }
    .links { margin-top: 18px; display: flex; gap: 12px; flex-wrap: wrap; }
    .links a {
      color: #8AC926;
      font-weight: 700;
      font-size: .85rem;
      text-decoration: none;
    }
    .links a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Simba Academy API</h1>
      <p>Backend server status</p>
      <span class="badge">${badge}</span>
    </div>
    <div class="body">
      ${checkRow("Database", data.checks.database.ok, data.checks.database.message)}
      ${checkRow("File storage", data.checks.storage.ok, `${data.checks.storage.message} · ${data.checks.storage.path}`)}
      ${checkRow("Payments", data.checks.payments.ok, data.checks.payments.message)}
      <div class="meta">
        Environment: <strong>${data.environment}</strong><br />
        Uptime: <strong>${formatUptime(data.uptime)}</strong><br />
        Last checked: <strong>${new Date(data.timestamp).toLocaleString("en-IN")}</strong>
      </div>
      <div class="links">
        <a href="${env.FRONTEND_URL}">← Back to website</a>
        <a href="?format=json">JSON status</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

const router = Router();

router.get("/health", async (req, res, next) => {
  try {
    const data = await getHealthStatus();
    const accept = req.headers.accept ?? "";
    const prefersHtml = accept.includes("text/html");
    const wantsJson =
      req.query.format === "json" || (!prefersHtml && req.query.format !== "html");

    if (wantsJson) {
      res.status(data.status === "ok" ? 200 : 503).json(data);
      return;
    }

    res
      .status(data.status === "ok" ? 200 : 503)
      .type("html")
      .send(renderHealthPage(data));
  } catch (err) {
    next(err);
  }
});

export default router;
