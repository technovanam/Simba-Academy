import { prisma } from "../config/database.js";
import { AppError } from "../utils/errors.js";
import { removeStoredFile } from "./removeStoredFile.js";

/**
 * Permanently delete a user row and related data (not soft-delete).
 * Removes uploaded materials (DB + files) and teacher tasks (DB + proof files).
 */
export async function hardDeleteUserById(
  userId: string,
  options?: { forbidSelfId?: string }
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (options?.forbidSelfId && user.id === options.forbidSelfId) {
    throw new AppError("Cannot delete your own account", 400);
  }

  if (user.role === "ADMIN") {
    throw new AppError("Admin accounts cannot be deleted from the dashboard", 400);
  }

  const materials = await prisma.material.findMany({
    where: { uploadedById: userId },
    select: { id: true, fileUrl: true },
  });
  for (const material of materials) {
    await removeStoredFile(material.fileUrl);
    await prisma.material.delete({ where: { id: material.id } });
  }

  if (user.role === "TEACHER") {
    const tasks = await prisma.task.findMany({
      where: { teacherId: userId },
      select: { id: true, proofUrl: true },
    });
    for (const task of tasks) {
      await removeStoredFile(task.proofUrl);
    }
    await prisma.task.deleteMany({ where: { teacherId: userId } });
  }

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
}
