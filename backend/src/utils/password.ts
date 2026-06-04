import crypto from "node:crypto";
import { prisma } from "../config/database.js";

const TEMP_PASSWORD_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";

export function generateTemporaryPassword(length = 12): string {
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += TEMP_PASSWORD_CHARS[bytes[i]! % TEMP_PASSWORD_CHARS.length];
  }
  return result;
}

export async function generateEmployeeId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `EMP-${year}-`;

  for (let attempt = 0; attempt < 20; attempt++) {
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    const employeeId = `${prefix}${suffix}`;
    const existing = await prisma.user.findUnique({ where: { employeeId } });
    if (!existing) return employeeId;
  }

  const fallback = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}${fallback}`;
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
