import { env } from "../config/env.js";
import { sendEmail } from "./email.js";
import {
  escapeHtml,
  renderCta,
  renderDetailsTable,
  renderEmailShell,
  renderHeading,
  renderLinkFallback,
  renderParagraph,
  type EmailTheme,
} from "./emailLayout.js";

export type PortalEmailTheme = "student" | "teacher";

const THEME: Record<
  PortalEmailTheme,
  { emailTheme: EmailTheme; portalName: string; dashboardUrl: string }
> = {
  student: {
    emailTheme: "orange",
    portalName: "Student Portal",
    dashboardUrl: `${env.FRONTEND_URL}/student/dashboard`,
  },
  teacher: {
    emailTheme: "green",
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

  return renderEmailShell({
    theme: t.emailTheme,
    eyebrow: t.portalName,
    title: escapeHtml(params.headline),
    subtitle: "You have a new update from Simba Preschool",
    content: `
      ${renderHeading(`Hello ${escapeHtml(params.recipientName)},`)}
      ${renderParagraph(escapeHtml(params.intro))}
      ${params.rows && params.rows.length > 0 ? renderDetailsTable(params.rows, t.emailTheme) : ""}
      ${renderCta(params.ctaUrl, params.ctaLabel, t.emailTheme)}
      ${renderLinkFallback(params.ctaUrl, t.emailTheme)}
      ${params.footerNote ? renderParagraph(escapeHtml(params.footerNote)) : ""}
    `,
    footerTitle: "Simba Preschool",
    footerLines: ["Salem, Tamil Nadu · www.simbapreschool.in"],
  });
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
