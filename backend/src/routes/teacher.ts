import { Router } from "express";
import { prisma } from "../config/database.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { submitTaskProofSchema } from "../config/schemas.js";
import { AppError } from "../utils/errors.js";
import { sendEmail } from "../services/email.js";
import { env } from "../config/env.js";

const router = Router();

// Require logged-in user with role TEACHER
router.use(authenticate, authorize("TEACHER"));

// ── Story library (teacher + both audience) ───────────────────────────
router.get("/books", async (_req, res, next) => {
  try {
    const books = await prisma.storyBook.findMany({
      where: { audience: { in: ["TEACHER", "BOTH"] } },
      orderBy: { createdAt: "desc" },
    });
    res.json(books);
  } catch (err) {
    next(err);
  }
});

// ── List Tasks Assigned to Current Teacher ───────────────────────────
router.get("/tasks", async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { teacherId: String(req.user!.userId) },
      orderBy: { createdAt: "desc" },
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// ── Submit Proof for Task ────────────────────────────────────────────
router.patch("/tasks/:id/proof", validate(submitTaskProofSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { proofUrl, proofDesc } = req.body;

    const task = await prisma.task.findFirst({
      where: { id: String(id), teacherId: String(req.user!.userId) },
      include: { teacher: { select: { name: true, email: true } } },
    });

    if (!task) {
      throw new AppError("Task not found or not assigned to you", 404);
    }

    if (task.status === "APPROVED") {
      throw new AppError("Cannot modify proof for an already approved task", 400);
    }

    const updated = await prisma.task.update({
      where: { id: String(id) },
      data: {
        proofUrl,
        proofDesc,
        status: "COMPLETED",
      },
      include: { teacher: { select: { name: true, email: true } } },
    });

    // Notify Admin via Email
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { email: true, name: true },
      });

      const absoluteProofUrl = proofUrl.startsWith("http")
        ? proofUrl
        : `${env.WEBDAV_BASE_URL || "http://localhost:3001"}${proofUrl}`;

      for (const admin of admins) {
        await sendEmail({
          to: admin.email,
          subject: `Task Completed by Teacher: ${task.title}`,
          html: `
            <h3>Task Completion Proof Submitted</h3>
            <p>Teacher <strong>${task.teacher.name}</strong> has submitted proof for the task:</p>
            <p><strong>Title:</strong> ${task.title}</p>
            <p><strong>Description:</strong> ${task.description || "N/A"}</p>
            <p><strong>Proof Comments:</strong> ${proofDesc}</p>
            <p><strong>Proof File:</strong> <a href="${absoluteProofUrl}" target="_blank">View Proof File</a></p>
            <br/>
            <p>Please log in to the Admin Dashboard to review and approve/reject this proof.</p>
          `,
        });
      }
    } catch (emailErr) {
      console.error("Failed to send task completion notification email to admins:", emailErr);
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
