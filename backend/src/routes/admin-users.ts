import { Router } from "express";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";
import { validate } from "../middleware/validate.js";
import {
  updateUserSchema,
  createTeacherSchema,
  updateTeacherSchema,
} from "../config/schemas.js";
import { AppError } from "../utils/errors.js";
import { sendEmail, getTeacherWelcomeHtml, getPasswordResetHtml } from "../services/email.js";
import { hardDeleteUserById } from "../services/hardDeleteUser.js";
import { env } from "../config/env.js";
import { generateEmployeeId, generateResetToken, generateTemporaryPassword } from "../utils/password.js";
import { buildPasswordResetUrl } from "../utils/passwordResetUrl.js";

const router = Router();

const userListSelect = {
  id: true,
  name: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  phone: true,
  studentClass: true,
  employeeId: true,
  status: true,
  mustChangePassword: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  _count: { select: { payments: true, uploadedFiles: true } },
} as const;

function buildFullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

async function sendPasswordResetEmail(userId: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { id: userId, isDeleted: false },
  });
  if (!user) {
    throw new AppError("User not found", 404);
  }
  if (user.status !== "ACTIVE") {
    throw new AppError("Cannot send reset email to a deactivated account", 400);
  }

  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_EXPIRES_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt },
  });

  const resetUrl = buildPasswordResetUrl(user.role, token);
  await sendEmail({
    to: user.email,
    subject: `Reset your ${env.PLATFORM_NAME} password`,
    html: getPasswordResetHtml({
      name: user.name,
      resetUrl,
      expiresMinutes: env.PASSWORD_RESET_EXPIRES_MINUTES,
      platformName: env.PLATFORM_NAME,
    }),
  });
}

// ── List Users (search / filter / sort) ─────────────────────────────
router.get("/users", async (req, res, next) => {
  try {
    const search = String(req.query.search ?? "").trim().toLowerCase();
    const filter = String(req.query.filter ?? "ALL").toUpperCase();
    const sort = String(req.query.sort ?? "NEWEST").toUpperCase();

    const where: Prisma.UserWhereInput = { isDeleted: false };

    if (filter === "ACTIVE") {
      where.status = "ACTIVE";
    } else if (filter === "DEACTIVATED") {
      where.status = "DEACTIVATED";
    } else if (filter === "TEACHERS") {
      where.role = "TEACHER";
    } else if (filter === "STUDENTS") {
      where.role = "STUDENT";
    } else if (filter === "ADMINS") {
      where.role = "ADMIN";
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { id: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { employeeId: { contains: search } },
        { studentClass: { contains: search } },
      ];
    }

    let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "OLDEST") orderBy = { createdAt: "asc" };
    else if (sort === "NAME_ASC") orderBy = { name: "asc" };
    else if (sort === "NAME_DESC") orderBy = { name: "desc" };

    const users = await prisma.user.findMany({
      where,
      orderBy,
      select: userListSelect,
    });

    res.json(users);
  } catch (err) {
    next(err);
  }
});

// ── List Teachers ───────────────────────────────────────────────────
router.get("/teachers", async (req, res, next) => {
  try {
    const search = String(req.query.search ?? "").trim().toLowerCase();
    const filter = String(req.query.filter ?? "ALL").toUpperCase();
    const sort = String(req.query.sort ?? "NEWEST").toUpperCase();

    const where: Prisma.UserWhereInput = { role: "TEACHER", isDeleted: false };

    if (filter === "ACTIVE") where.status = "ACTIVE";
    else if (filter === "DEACTIVATED") where.status = "DEACTIVATED";

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { id: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { employeeId: { contains: search } },
        { studentClass: { contains: search } },
      ];
    }

    let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "OLDEST") orderBy = { createdAt: "asc" };
    else if (sort === "NAME_ASC") orderBy = { name: "asc" };
    else if (sort === "NAME_DESC") orderBy = { name: "desc" };

    const teachers = await prisma.user.findMany({
      where,
      orderBy,
      select: userListSelect,
    });

    res.json(teachers);
  } catch (err) {
    next(err);
  }
});

// ── Create Teacher ────────────────────────────────────────────────────
router.post("/teachers", validate(createTeacherSchema), async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, studentClass } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing && !existing.isDeleted) {
      throw new AppError("Email already registered", 409);
    }

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
    const employeeId = await generateEmployeeId();
    const name = buildFullName(firstName, lastName);

    const teacher = await prisma.user.create({
      data: {
        name,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone?.trim() || null,
        studentClass: studentClass || null,
        role: "TEACHER",
        employeeId,
        status: "ACTIVE",
        mustChangePassword: true,
        createdBy: req.user!.userId,
      },
      select: userListSelect,
    });

    let emailSent = false;
    try {
      emailSent = await sendEmail({
        to: teacher.email,
        subject: `Welcome to ${env.PLATFORM_NAME}`,
        html: getTeacherWelcomeHtml({
          teacherName: teacher.name,
          email: teacher.email,
          temporaryPassword,
          loginUrl: `${env.FRONTEND_URL}/teacher/login`,
          platformName: env.PLATFORM_NAME,
        }),
      });
    } catch (emailErr) {
      console.error("Failed to send teacher welcome email:", emailErr);
    }

    if (!emailSent && env.NODE_ENV === "development") {
      console.warn(
        `[Teacher created] ${teacher.email} — welcome email not sent. Temporary password is in the log above (TEMPORARY PASSWORD line).`
      );
    }

    res.status(201).json({
      ...teacher,
      emailSent,
      emailWarning: emailSent
        ? undefined
        : "Welcome email could not be sent. Fix Resend API settings or read the backend log for the temporary password.",
    });
  } catch (err) {
    next(err);
  }
});

// ── Update Teacher ────────────────────────────────────────────────────
router.patch("/teachers/:id", validate(updateTeacherSchema), async (req, res, next) => {
  try {
    const teacher = await prisma.user.findFirst({
      where: { id: String(req.params.id), role: "TEACHER", isDeleted: false },
    });
    if (!teacher) {
      throw new AppError("Teacher not found", 404);
    }

    const data: Prisma.UserUpdateInput = { ...req.body };
    if (req.body.firstName || req.body.lastName) {
      const first = (req.body.firstName ?? teacher.firstName ?? teacher.name.split(" ")[0]) as string;
      const last = (req.body.lastName ?? teacher.lastName ?? "") as string;
      data.name = buildFullName(first, last);
      if (req.body.firstName) data.firstName = req.body.firstName.trim();
      if (req.body.lastName) data.lastName = req.body.lastName.trim();
    }
    if (req.body.email) {
      const normalizedEmail = req.body.email.toLowerCase().trim();
      const duplicate = await prisma.user.findFirst({
        where: { email: normalizedEmail, id: { not: teacher.id }, isDeleted: false },
      });
      if (duplicate) {
        throw new AppError("Email already in use", 409);
      }
      data.email = normalizedEmail;
    }

    const updated = await prisma.user.update({
      where: { id: teacher.id },
      data,
      select: userListSelect,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── Send Password Reset (teacher) ───────────────────────────────────
router.post("/teachers/:id/send-reset", async (req, res, next) => {
  try {
    const teacher = await prisma.user.findFirst({
      where: { id: String(req.params.id), role: "TEACHER", isDeleted: false },
    });
    if (!teacher) {
      throw new AppError("Teacher not found", 404);
    }

    await sendPasswordResetEmail(teacher.id);
    res.json({ message: "Password reset email sent successfully" });
  } catch (err) {
    next(err);
  }
});

// ── Update User ─────────────────────────────────────────────────────
router.patch("/users/:id", validate(updateUserSchema), async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: String(req.params.id), isDeleted: false },
    });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.id === req.user!.userId) {
      if (req.body.role && req.body.role !== "ADMIN") {
        throw new AppError("You cannot change your own role", 400);
      }
      if (req.body.status === "DEACTIVATED") {
        throw new AppError("You cannot deactivate your own account", 400);
      }
    }

    const data: Prisma.UserUpdateInput = { ...req.body };
    if (req.body.firstName || req.body.lastName) {
      const first = (req.body.firstName ?? user.firstName ?? user.name.split(" ")[0]) as string;
      const last = (req.body.lastName ?? user.lastName ?? "") as string;
      data.name = buildFullName(first, last);
    }
    if (req.body.email) {
      const normalizedEmail = req.body.email.toLowerCase().trim();
      const duplicate = await prisma.user.findFirst({
        where: { email: normalizedEmail, id: { not: user.id }, isDeleted: false },
      });
      if (duplicate) {
        throw new AppError("Email already in use", 409);
      }
      data.email = normalizedEmail;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: userListSelect,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── Send Password Reset (any user — teachers/students) ──────────────
router.post("/users/:id/send-reset", async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: String(req.params.id), isDeleted: false },
    });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    if (user.role === "ADMIN") {
      throw new AppError("Password reset emails are not sent for admin accounts via this action", 400);
    }

    await sendPasswordResetEmail(user.id);
    res.json({ message: "Password reset email sent successfully" });
  } catch (err) {
    next(err);
  }
});

// ── Hard Delete User (students / teachers — DB + uploaded files) ───────
router.delete("/users/:id", async (req, res, next) => {
  try {
    await hardDeleteUserById(String(req.params.id), { forbidSelfId: req.user!.userId });
    res.json({ message: "User permanently deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
