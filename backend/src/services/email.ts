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
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams): Promise<void> {
  await transporter.sendMail({
    from: `"Simba Academy" <${env.EMAIL_FROM}>`,
    to,
    subject,
    html,
    replyTo,
  });
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
