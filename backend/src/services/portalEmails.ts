import { env } from "../config/env.js";
import { sendEmail } from "./email.js";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type PortalEmailTheme = "student" | "teacher";

const THEME: Record<
  PortalEmailTheme,
  { accent: string; accentDark: string; portalName: string; dashboardUrl: string }
> = {
  student: {
    accent: "#FF9F1C",
    accentDark: "#e88f0a",
    portalName: "Student Portal",
    dashboardUrl: `${env.FRONTEND_URL}/student/dashboard`,
  },
  teacher: {
    accent: "#8AC926",
    accentDark: "#78B020",
    portalName: "Teacher Portal",
    dashboardUrl: `${env.FRONTEND_URL}/teacher/dashboard`,
  },
};

export function getPortalNotificationEmailHtml(params: {
  theme: PortalEmailTheme;
  recipientName: string;
  headline: string;
  intro: string;
  rows?: { label: string; value: string }[];
  ctaLabel: string;
  ctaUrl: string;
  footerNote?: string;
}): string {
  const t = THEME[params.theme];
  const rows = params.rows ?? [];
  const rowHtml = rows
    .map(
      (row) => `
      <tr>
        <td style="padding: 12px 16px; font-weight: 600; color: #64748b; width: 130px; vertical-align: top; border-bottom: 1px solid #e2e8f0;">${escapeHtml(row.label)}</td>
        <td style="padding: 12px 16px; color: #0f172a; vertical-align: top; border-bottom: 1px solid #e2e8f0;">${escapeHtml(row.value)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:24px 12px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="background:linear-gradient(135deg, ${t.accent} 0%, ${t.accentDark} 100%);padding:28px 24px;border-radius:16px 16px 0 0;text-align:center;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.9);">Simba Academy</p>
      <h1 style="margin:0;font-size:22px;line-height:1.3;color:#ffffff;">${escapeHtml(params.headline)}</h1>
      <p style="margin:10px 0 0;font-size:13px;color:rgba(255,255,255,0.92);">${escapeHtml(t.portalName)}</p>
    </div>
    <div style="background:#ffffff;padding:28px 24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;">
      <p style="margin:0 0 12px;font-size:15px;color:#334155;">Hello <strong>${escapeHtml(params.recipientName)}</strong>,</p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.65;color:#475569;">${escapeHtml(params.intro)}</p>
      ${
        rows.length > 0
          ? `<table style="width:100%;border-collapse:collapse;margin:0 0 24px;background:#f8fafc;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">${rowHtml}</table>`
          : ""
      }
      <p style="margin:0 0 24px;text-align:center;">
        <a href="${params.ctaUrl}" style="background:${t.accent};color:#ffffff;padding:14px 28px;text-decoration:none;font-weight:700;border-radius:10px;display:inline-block;font-size:14px;">${escapeHtml(params.ctaLabel)}</a>
      </p>
      <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;word-break:break-all;">
        Or open: <a href="${params.ctaUrl}" style="color:${t.accentDark};">${escapeHtml(params.ctaUrl)}</a>
      </p>
      ${
        params.footerNote
          ? `<p style="margin:20px 0 0;font-size:12px;color:#64748b;line-height:1.5;text-align:center;">${escapeHtml(params.footerNote)}</p>`
          : ""
      }
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 16px;">
      <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">© Simba Academy · Salem, Tamil Nadu</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendPortalNotificationEmail(params: {
  to: string;
  subject: string;
  theme: PortalEmailTheme;
  recipientName: string;
  headline: string;
  intro: string;
  rows?: { label: string; value: string }[];
  ctaLabel: string;
  ctaUrl: string;
  footerNote?: string;
}): Promise<void> {
  const html = getPortalNotificationEmailHtml({
    theme: params.theme,
    recipientName: params.recipientName,
    headline: params.headline,
    intro: params.intro,
    rows: params.rows,
    ctaLabel: params.ctaLabel,
    ctaUrl: params.ctaUrl,
    footerNote: params.footerNote,
  });

  await sendEmail({
    to: params.to,
    subject: params.subject,
    html,
  });
}
