export type EmailTheme = "green" | "orange" | "dark" | "success";

const THEMES: Record<
  EmailTheme,
  { gradient: string; accent: string; accentDark: string; softBg: string; softBorder: string }
> = {
  green: {
    gradient: "linear-gradient(135deg, #8AC926 0%, #6B9E1A 55%, #78B020 100%)",
    accent: "#8AC926",
    accentDark: "#6B9E1A",
    softBg: "#f4fbe8",
    softBorder: "#d4ed9f",
  },
  orange: {
    gradient: "linear-gradient(135deg, #FF9F1C 0%, #f08c00 55%, #e88f0a 100%)",
    accent: "#FF9F1C",
    accentDark: "#e88f0a",
    softBg: "#fff7ed",
    softBorder: "#fed7aa",
  },
  dark: {
    gradient: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    accent: "#8AC926",
    accentDark: "#78B020",
    softBg: "#f8fafc",
    softBorder: "#e2e8f0",
  },
  success: {
    gradient: "linear-gradient(135deg, #22c55e 0%, #16a34a 55%, #15803d 100%)",
    accent: "#22c55e",
    accentDark: "#16a34a",
    softBg: "#f0fdf4",
    softBorder: "#bbf7d0",
  },
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#475569;">${text}</p>`;
}

export function renderHeading(text: string): string {
  return `<h2 style="margin:0 0 14px;font-size:22px;line-height:1.35;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">${text}</h2>`;
}

export function renderCta(href: string, label: string, theme: EmailTheme = "green"): string {
  const t = THEMES[theme];
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto;">
    <tr>
      <td align="center" style="border-radius:12px;background:${t.accent};box-shadow:0 8px 20px -6px ${t.accent}66;">
        <a href="${href}" style="display:inline-block;padding:15px 32px;font-size:14px;font-weight:800;color:#ffffff;text-decoration:none;letter-spacing:0.04em;text-transform:uppercase;border-radius:12px;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

export function renderLinkFallback(href: string, theme: EmailTheme = "green"): string {
  const t = THEMES[theme];
  return `<p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;text-align:center;word-break:break-all;">Or copy this link:<br><a href="${href}" style="color:${t.accentDark};text-decoration:underline;">${escapeHtml(href)}</a></p>`;
}

export function renderDetailsTable(
  rows: { label: string; value: string; mono?: boolean }[],
  theme: EmailTheme = "green"
): string {
  const t = THEMES[theme];
  const rowHtml = rows
    .map(
      (row, index) => `
      <tr>
        <td style="padding:14px 18px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;width:140px;vertical-align:top;${index < rows.length - 1 ? "border-bottom:1px solid #e2e8f0;" : ""}">${escapeHtml(row.label)}</td>
        <td style="padding:14px 18px;font-size:15px;font-weight:600;color:#0f172a;vertical-align:top;${row.mono ? "font-family:'Courier New',Courier,monospace;letter-spacing:0.04em;" : ""}${index < rows.length - 1 ? "border-bottom:1px solid #e2e8f0;" : ""}">${escapeHtml(row.value)}</td>
      </tr>`
    )
    .join("");

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;border-collapse:separate;border-spacing:0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
    ${rowHtml}
  </table>`;
}

export function renderCredentialCard(
  rows: { label: string; value: string }[],
  theme: EmailTheme = "green"
): string {
  const t = THEMES[theme];
  const rowHtml = rows
    .map(
      (row) => `
      <tr>
        <td style="padding:16px 20px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;width:150px;vertical-align:middle;border-bottom:1px solid ${t.softBorder};">${escapeHtml(row.label)}</td>
        <td style="padding:16px 20px;font-size:15px;font-weight:700;color:#0f172a;vertical-align:middle;border-bottom:1px solid ${t.softBorder};${row.label.toLowerCase().includes("password") ? "font-family:'Courier New',Courier,monospace;letter-spacing:0.06em;background:#ffffff;border-radius:8px;" : ""}">${escapeHtml(row.value)}</td>
      </tr>`
    )
    .join("");

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;border-collapse:separate;border-spacing:0;background:${t.softBg};border:1px solid ${t.softBorder};border-radius:16px;overflow:hidden;box-shadow:0 4px 14px -8px ${t.accent}55;">
    <tr>
      <td colspan="2" style="padding:14px 20px;background:${t.accent};color:#ffffff;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">Secure Login Credentials</td>
    </tr>
    ${rowHtml}
  </table>`;
}

export function renderHighlightBox(title: string, body: string, theme: EmailTheme = "green"): string {
  const t = THEMES[theme];
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;background:${t.softBg};border:1px solid ${t.softBorder};border-radius:16px;">
    <tr>
      <td style="padding:22px 24px;text-align:center;">
        <p style="margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${t.accentDark};">${escapeHtml(title)}</p>
        <p style="margin:0;font-size:14px;line-height:1.65;color:#475569;">${body}</p>
      </td>
    </tr>
  </table>`;
}

export function renderMessageQuote(message: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 0;background:#f8fafc;border-left:4px solid #8AC926;border-radius:0 12px 12px 0;">
    <tr>
      <td style="padding:18px 20px;font-size:14px;line-height:1.7;color:#334155;white-space:pre-line;">${escapeHtml(message)}</td>
    </tr>
  </table>`;
}

export function renderStatPills(items: { label: string; value: string }[], theme: EmailTheme = "green"): string {
  const t = THEMES[theme];
  const pills = items
    .map(
      (item) => `
      <td style="padding:6px;" width="50%" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;">
          <tr>
            <td style="padding:16px 14px;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">${escapeHtml(item.label)}</p>
              <p style="margin:0;font-size:18px;font-weight:800;color:${t.accentDark};">${escapeHtml(item.value)}</p>
            </td>
          </tr>
        </table>
      </td>`
    )
    .join("");

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;">
    <tr>${pills}</tr>
  </table>`;
}

export function renderEmailShell(params: {
  theme?: EmailTheme;
  eyebrow: string;
  title: string;
  subtitle?: string;
  content: string;
  footerTitle?: string;
  footerLines?: string[];
}): string {
  const theme = params.theme ?? "green";
  const t = THEMES[theme];
  const footerLines = params.footerLines ?? [
    "Simba Preschool · Salem, Tamil Nadu",
    "www.simbapreschool.in",
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(params.title)}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#eef2f7;">
    <tr>
      <td align="center" style="padding:36px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">
          <tr>
            <td style="padding:0 0 14px;text-align:center;">
              <span style="display:inline-block;padding:8px 14px;border-radius:999px;background:#ffffff;border:1px solid #e2e8f0;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#64748b;">Simba Preschool</span>
            </td>
          </tr>
          <tr>
            <td style="border-radius:20px;overflow:hidden;box-shadow:0 18px 40px -20px rgba(15,23,42,0.28);border:1px solid #e2e8f0;background:#ffffff;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:34px 28px 30px;background:${t.gradient};text-align:center;">
                    <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.88);">${escapeHtml(params.eyebrow)}</p>
                    <h1 style="margin:0;font-size:28px;line-height:1.25;font-weight:900;color:#ffffff;letter-spacing:-0.03em;">${escapeHtml(params.title)}</h1>
                    ${params.subtitle ? `<p style="margin:12px 0 0;font-size:14px;line-height:1.5;color:rgba(255,255,255,0.92);">${escapeHtml(params.subtitle)}</p>` : ""}
                  </td>
                </tr>
                <tr>
                  <td style="padding:34px 30px 28px;background:#ffffff;">
                    ${params.content}
                  </td>
                </tr>
                <tr>
                  <td style="padding:22px 30px 26px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                    <p style="margin:0 0 6px;font-size:14px;font-weight:800;color:#334155;">${escapeHtml(params.footerTitle ?? "Simba Preschool Team")}</p>
                    ${footerLines
                      .map(
                        (line) =>
                          `<p style="margin:0 0 4px;font-size:12px;line-height:1.5;color:#94a3b8;">${escapeHtml(line)}</p>`
                      )
                      .join("")}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 8px 0;text-align:center;">
              <p style="margin:0;font-size:11px;line-height:1.5;color:#94a3b8;">You received this email from Simba Preschool. Please do not share passwords or private links.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
