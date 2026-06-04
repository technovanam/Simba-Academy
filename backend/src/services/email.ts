import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  connectionTimeout: 8_000,
  greetingTimeout: 8_000,
  socketTimeout: 10_000,
});

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

/** @returns true if the message was delivered to SMTP; false if dev bypass after failure */
export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"Simba Academy" <${env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      replyTo,
    });
    console.log(`✉️ Email successfully sent to ${to} (Subject: "${subject}")`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to} (Subject: "${subject}"):`, error);

    if (env.NODE_ENV === "development" || env.SMTP_USER === "placeholder@email.com") {
      logDevEmailFallback(to, subject, html);
      return false;
    }

    throw error;
  }
}

// ── Inquiry Auto-Reply ──────────────────────────────────────────────
export function getInquiryAutoReplyHtml(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f97316; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Simba Academy</h1>
  </div>
  <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
    <h2>Thank you for reaching out, ${name}!</h2>
    <p>We have received your inquiry and will get back to you shortly.</p>
    <p>In the meantime, feel free to visit our website for more information about our programs.</p>
    <br>
    <p>Warm regards,</p>
    <p><strong>Simba Academy Team</strong></p>
    <hr style="border: none; border-top: 1px solid #ddd;">
    <p style="color: #666; font-size: 12px;">
      📍 Salem, Tamil Nadu<br>
      🌐 <a href="https://www.simbapreschool.in" style="color: #f97316;">www.simbapreschool.in</a>
    </p>
  </div>
</body>
</html>`;
}

// ── Admin Notification ──────────────────────────────────────────────
export function getAdminInquiryHtml(data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f97316; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">New Inquiry Received</h1>
  </div>
  <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px; font-weight: bold;">Name:</td><td style="padding: 8px;">${data.name}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;">${data.email}</td></tr>
      ${data.phone ? `<tr><td style="padding: 8px; font-weight: bold;">Phone:</td><td style="padding: 8px;">${data.phone}</td></tr>` : ""}
      <tr><td style="padding: 8px; font-weight: bold;">Message:</td><td style="padding: 8px;">${data.message}</td></tr>
    </table>
    <hr style="border: none; border-top: 1px solid #ddd;">
    <p style="color: #666; font-size: 12px;">Received from simbapreschool.in contact form</p>
  </div>
</body>
</html>`;
}

// ── Payment Confirmation ────────────────────────────────────────────
// ── Teacher Welcome ─────────────────────────────────────────────────
export function getTeacherWelcomeHtml(params: {
  teacherName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
  platformName: string;
}): string {
  const { teacherName, email, temporaryPassword, loginUrl, platformName } = params;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f5;">
  <div style="background: linear-gradient(135deg, #8AC926 0%, #78B020 100%); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 22px;">${platformName}</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Account Created Successfully</p>
  </div>
  <div style="background: #ffffff; padding: 28px; border-radius: 0 0 12px 12px; border: 1px solid #e4e4e7;">
    <p style="font-size: 15px; color: #334155;">Hello <strong>${teacherName}</strong>,</p>
    <p style="font-size: 14px; color: #475569; line-height: 1.6;">
      Your teacher portal account has been created. Use the credentials below to sign in.
      You will be asked to set a new password on first login.
    </p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 8px; overflow: hidden;">
      <tr><td style="padding: 12px 16px; font-weight: bold; color: #64748b; width: 140px;">Login Email</td><td style="padding: 12px 16px; color: #0f172a;">${email}</td></tr>
      <tr><td style="padding: 12px 16px; font-weight: bold; color: #64748b;">Temporary Password</td><td style="padding: 12px 16px; color: #0f172a; font-family: monospace;">${temporaryPassword}</td></tr>
    </table>
    <p style="text-align: center; margin: 28px 0;">
      <a href="${loginUrl}" style="background: #FF9F1C; color: white; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Open Teacher Portal</a>
    </p>
    <p style="font-size: 12px; color: #94a3b8; text-align: center;">Login link: <a href="${loginUrl}" style="color: #8AC926;">${loginUrl}</a></p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
    <p style="font-size: 11px; color: #94a3b8; text-align: center;">© ${platformName} · Secure staff access only</p>
  </div>
</body>
</html>`;
}

// ── Password Reset ────────────────────────────────────────────────────
export function getPasswordResetHtml(params: {
  name: string;
  resetUrl: string;
  expiresMinutes: number;
  platformName: string;
}): string {
  const { name, resetUrl, expiresMinutes, platformName } = params;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0f172a; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">${platformName}</h1>
    <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px;">Password Reset Request</p>
  </div>
  <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
    <p>Hello <strong>${name}</strong>,</p>
    <p>We received a request to reset your password. Click the button below to choose a new password.</p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${resetUrl}" style="background: #8AC926; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px;">Reset Password</a>
    </p>
    <p style="font-size: 13px; color: #64748b;">This link expires in <strong>${expiresMinutes} minutes</strong>. If you did not request this, you can ignore this email.</p>
    <p style="font-size: 12px; color: #94a3b8; word-break: break-all;">${resetUrl}</p>
  </div>
</body>
</html>`;
}

// ── Payment Confirmation ────────────────────────────────────────────
export function getPaymentSuccessHtml(name: string, amount: number, courseName?: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #22c55e; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Payment Successful! ✅</h1>
  </div>
  <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
    <h2>Thank you, ${name}!</h2>
    <p>Your payment of <strong>₹${amount.toLocaleString("en-IN")}</strong> was successful.</p>
    ${courseName ? `<p>Enrolled in: <strong>${courseName}</strong></p>` : ""}
    <p>You can now access all course materials on your student portal.</p>
    <br>
    <p>Warm regards,</p>
    <p><strong>Simba Academy Team</strong></p>
  </div>
</body>
</html>`;
}
