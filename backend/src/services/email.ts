import { Resend } from "resend";
import { env } from "../config/env.js";
import {
  escapeHtml,
  renderCredentialCard,
  renderCta,
  renderDetailsTable,
  renderEmailShell,
  renderHeading,
  renderHighlightBox,
  renderLinkFallback,
  renderMessageQuote,
  renderParagraph,
  renderStatPills,
} from "./emailLayout.js";

const resend = env.RESEND_API_KEY && env.RESEND_API_KEY !== "re_xxxxxxxxx"
  ? new Resend(env.RESEND_API_KEY)
  : null;

function logDevEmailFallback(to: string, subject: string, html: string): void {
  console.warn("⚠️ [DEV MODE] Email delivery failed but bypassed. Message details below:");
  console.log("========================================");
  console.log(`TO: ${to}`);
  console.log(`SUBJECT: ${subject}`);

  const tempPassword = html.match(
    /Temporary Password<\/td><td[^>]*>([^<]+)</i
  )?.[1];
  if (tempPassword) {
    console.log(`TEMPORARY PASSWORD: ${tempPassword.trim()}`);
  }

  const links = [...new Set(html.match(/href="([^"]+)"/g)?.map((l) => l.replace(/href="|"/g, "")) ?? [])];
  if (links.length > 0) {
    console.log("LINKS:");
    links.forEach((l) => console.log(`  - ${l}`));
  }
  console.log("========================================");
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/** @returns true if the message was delivered to Resend; false if dev bypass after failure */
export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams): Promise<boolean> {
  try {
    if (!resend) {
      console.warn("⚠️ [DEV MODE] Resend is not configured (RESEND_API_KEY is missing or placeholder). Falling back to console log.");
      logDevEmailFallback(to, subject, html);
      return false;
    }

    const { data, error } = await resend.emails.send({
      from: `"Simba Academy" <${env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      replyTo,
    });

    if (error) {
      throw error;
    }

    console.log(`✉️ Email successfully sent to ${to} (Subject: "${subject}") via Resend (ID: ${data?.id})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to} (Subject: "${subject}") via Resend:`, error);

    if (env.NODE_ENV === "development" || !resend) {
      logDevEmailFallback(to, subject, html);
      return false;
    }

    throw error;
  }
}

export function getInquiryAutoReplyHtml(name: string): string {
  return renderEmailShell({
    theme: "green",
    eyebrow: "Admissions",
    title: "We Received Your Inquiry",
    subtitle: "Thank you for contacting Simba Academy",
    content: `
      ${renderHeading(`Hello ${escapeHtml(name)},`)}
      ${renderParagraph("Thank you for reaching out to <strong>Simba Academy</strong>. Your inquiry has been received and our admissions team is reviewing it now.")}
      ${renderParagraph("A member of our team will get back to you shortly with details about our programs, curriculum, enrollment process, and campus visits.")}
      ${renderHighlightBox(
        "Explore Simba Online",
        "Discover our preschool branches, learning philosophy, and parent resources on our official website.",
        "green"
      )}
      ${renderCta("https://www.simbapreschool.in", "Visit Our Website", "orange")}
    `,
    footerTitle: "Simba Admissions Team",
    footerLines: ["Salem, Tamil Nadu · +91 98848 66727", "contact@simbapreschool.in"],
  });
}

export function getFranchiseAutoReplyHtml(name: string): string {
  return renderEmailShell({
    theme: "orange",
    eyebrow: "Franchise",
    title: "Partnership Inquiry Received",
    subtitle: "Thank you for your interest in Simba Academy",
    content: `
      ${renderHeading(`Hello ${escapeHtml(name)},`)}
      ${renderParagraph("Thank you for your interest in partnering with <strong>Simba Academy</strong>. We have successfully received your franchise inquiry.")}
      ${renderParagraph("Our franchise development team will review your details and contact you within <strong>2–3 business days</strong> to discuss collaboration opportunities and next steps.")}
      ${renderHighlightBox(
        "Build With a Trusted Brand",
        "Join a growing preschool network known for quality early education and strong parent trust across Salem.",
        "orange"
      )}
      ${renderCta("https://www.simbapreschool.in/franchise", "Explore Partnership Model", "green")}
    `,
    footerTitle: "Simba Franchise Relations",
    footerLines: ["Salem, Tamil Nadu", "partner@simbapreschool.in"],
  });
}

export function getAdminInquiryHtml(data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
  isFranchise?: boolean;
  location?: string;
}): string {
  const title = data.isFranchise ? "New Franchise Inquiry" : "New General Inquiry";
  const rows = [
    { label: "Name", value: data.name },
    { label: "Email", value: data.email },
    ...(data.phone ? [{ label: "Phone", value: data.phone }] : []),
    ...(data.location ? [{ label: "Location", value: data.location }] : []),
  ];

  return renderEmailShell({
    theme: data.isFranchise ? "orange" : "green",
    eyebrow: "Admin Alert",
    title,
    subtitle: "A new message arrived from the website form",
    content: `
      ${renderParagraph("A visitor submitted a new inquiry through the Simba Academy website. Review the details below and follow up when ready.")}
      ${renderDetailsTable(rows, data.isFranchise ? "orange" : "green")}
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Message</p>
      ${renderMessageQuote(data.message)}
    `,
    footerTitle: "Simba Website Notifications",
    footerLines: ["Received from Simba Academy landing page form"],
  });
}

export function getTeacherWelcomeHtml(params: {
  teacherName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
  platformName: string;
}): string {
  const { teacherName, email, temporaryPassword, loginUrl, platformName } = params;

  return renderEmailShell({
    theme: "green",
    eyebrow: "Teacher Portal",
    title: "Your Account Is Ready",
    subtitle: `${platformName} · Staff access created`,
    content: `
      ${renderHeading(`Welcome, ${escapeHtml(teacherName)}!`)}
      ${renderParagraph("Your teacher portal account has been created. Use the secure credentials below to sign in for the first time.")}
      ${renderParagraph("For your security, you will be asked to set a new password immediately after your first login.")}
      ${renderCredentialCard(
        [
          { label: "Login Email", value: email },
          { label: "Temporary Password", value: temporaryPassword },
        ],
        "green"
      )}
      ${renderCta(loginUrl, "Open Teacher Portal", "orange")}
      ${renderLinkFallback(loginUrl, "green")}
    `,
    footerTitle: platformName,
    footerLines: ["Secure staff access only · Do not share your password"],
  });
}

export function getPasswordResetHtml(params: {
  name: string;
  resetUrl: string;
  expiresMinutes: number;
  platformName: string;
}): string {
  const { name, resetUrl, expiresMinutes, platformName } = params;

  return renderEmailShell({
    theme: "dark",
    eyebrow: "Account Security",
    title: "Reset Your Password",
    subtitle: `${platformName} · Password reset request`,
    content: `
      ${renderHeading(`Hello ${escapeHtml(name)},`)}
      ${renderParagraph("We received a request to reset your account password. Click the button below to choose a new password and regain access to your portal.")}
      ${renderHighlightBox(
        "Time-Sensitive Link",
        `This reset link expires in <strong>${expiresMinutes} minutes</strong>. If you did not request a password reset, you can safely ignore this email.`,
        "dark"
      )}
      ${renderCta(resetUrl, "Reset Password", "green")}
      ${renderLinkFallback(resetUrl, "green")}
    `,
    footerTitle: platformName,
    footerLines: ["If you need help, contact your school administrator"],
  });
}

export function getPaymentSuccessHtml(name: string, amount: number, courseName?: string): string {
  const formattedAmount = `₹${amount.toLocaleString("en-IN")}`;

  return renderEmailShell({
    theme: "success",
    eyebrow: "Payment Confirmation",
    title: "Payment Successful",
    subtitle: "Your enrollment is now active",
    content: `
      ${renderHeading(`Thank you, ${escapeHtml(name)}!`)}
      ${renderParagraph("Your payment has been processed successfully. You can now access your course materials and continue your learning journey on the student portal.")}
      ${renderStatPills(
        [
          { label: "Amount Paid", value: formattedAmount },
          { label: "Status", value: "Confirmed" },
        ],
        "success"
      )}
      ${
        courseName
          ? renderDetailsTable([{ label: "Course", value: courseName }], "success")
          : ""
      }
      ${renderCta(`${env.FRONTEND_URL}/student/dashboard`, "Open Student Portal", "orange")}
    `,
    footerTitle: "Simba Academy Billing",
    footerLines: ["Keep this email for your payment records"],
  });
}

export function getTaskCompletionAdminHtml(data: {
  teacherName: string;
  taskTitle: string;
  taskDescription?: string;
  proofComments?: string;
  proofUrl: string;
}): string {
  return renderEmailShell({
    theme: "orange",
    eyebrow: "Teacher Task Update",
    title: "Proof Submitted for Review",
    subtitle: "A teacher has completed a task and uploaded proof",
    content: `
      ${renderParagraph(`<strong>${escapeHtml(data.teacherName)}</strong> has submitted completion proof for a teacher task. Please review it in the admin dashboard.`)}
      ${renderDetailsTable(
        [
          { label: "Teacher", value: data.teacherName },
          { label: "Task", value: data.taskTitle },
          ...(data.taskDescription ? [{ label: "Description", value: data.taskDescription }] : []),
          ...(data.proofComments ? [{ label: "Comments", value: data.proofComments }] : []),
        ],
        "orange"
      )}
      ${renderCta(data.proofUrl, "View Proof File", "green")}
      ${renderLinkFallback(data.proofUrl, "green")}
      ${renderParagraph("Log in to the Admin Dashboard to approve or reject this submission.")}
    `,
    footerTitle: "Simba Admin Notifications",
    footerLines: ["Teacher workflow · Action required"],
  });
}
