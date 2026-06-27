import type { Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";
import { STUDENT_CLASS_LEVELS } from "../config/schemas.js";
import { AppError } from "./errors.js";

const VALID_CLASSES = new Set<string>(STUDENT_CLASS_LEVELS);

export function normalizeClassList(classes: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of classes) {
    const trimmed = raw.trim();
    if (!trimmed || !VALID_CLASSES.has(trimmed) || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

export function parseTargetClasses(targetCsv: string | null | undefined): string[] {
  if (!targetCsv?.trim()) return [];
  return targetCsv
    .split(",")
    .map((c) => c.trim())
    .filter((c) => VALID_CLASSES.has(c));
}

export function teacherMatchesAnyClass(
  assigned: string[],
  targetCsv: string | null | undefined
): boolean {
  const targets = parseTargetClasses(targetCsv);
  if (targets.length === 0) return true;
  return assigned.some((c) => targets.includes(c));
}

export function buildStudentClassFilter(
  classes: string[],
  activeClass?: string | null
): Prisma.UserWhereInput {
  if (activeClass && activeClass !== "all") {
    return { studentClass: activeClass };
  }
  return { studentClass: { in: classes } };
}

export async function getTeacherAssignedClasses(teacherId: string): Promise<string[]> {
  const rows = await prisma.teacherAssignedClass.findMany({
    where: { teacherId },
    select: { className: true },
    orderBy: { className: "asc" },
  });

  if (rows.length > 0) {
    return rows.map((r) => r.className);
  }

  const teacher = await prisma.user.findFirst({
    where: { id: teacherId, role: "TEACHER", isDeleted: false },
    select: { studentClass: true },
  });

  if (teacher?.studentClass && VALID_CLASSES.has(teacher.studentClass)) {
    return [teacher.studentClass];
  }

  return [];
}

export function resolveActiveClassFilter(
  assignedClasses: string[],
  queryClass?: string | null
): string[] {
  const param = queryClass?.trim();
  if (!param || param.toLowerCase() === "all") {
    return assignedClasses;
  }
  if (!assignedClasses.includes(param)) {
    throw new AppError("Invalid class filter", 400);
  }
  return [param];
}

export async function syncTeacherAssignedClasses(
  teacherId: string,
  classes: string[]
): Promise<string[]> {
  const normalized = normalizeClassList(classes);
  if (normalized.length === 0) {
    throw new AppError("At least one assigned class is required", 400);
  }

  await prisma.$transaction([
    prisma.teacherAssignedClass.deleteMany({ where: { teacherId } }),
    prisma.teacherAssignedClass.createMany({
      data: normalized.map((className) => ({ teacherId, className })),
    }),
    prisma.user.update({
      where: { id: teacherId },
      data: { studentClass: null },
    }),
  ]);

  return normalized;
}

export function buildLessonPlanClassFilter(assignedClasses: string[]): Prisma.LessonPlanWhereInput {
  if (assignedClasses.length === 0) {
    return { OR: [{ targetClass: null }, { targetClass: "" }] };
  }

  const classConditions: Prisma.LessonPlanWhereInput[] = assignedClasses.map((cls) => ({
    targetClass: { contains: cls },
  }));

  return {
    OR: [{ targetClass: null }, { targetClass: "" }, ...classConditions],
  };
}

export function computeClassStrength(
  assignedClasses: string[],
  strengthMap: Record<string, number>
): number {
  return assignedClasses.reduce((sum, cls) => sum + (strengthMap[cls] ?? 0), 0);
}

/** Prisma filter: active teachers matching any of the target classes (multi-class aware). */
export function buildTeacherClassMatchFilter(targetClasses: string[]): Prisma.UserWhereInput {
  if (targetClasses.length === 0) {
    return {};
  }
  return {
    OR: [
      {
        teacherAssignedClasses: {
          some: { className: { in: targetClasses } },
        },
      },
      {
        studentClass: { in: targetClasses },
        teacherAssignedClasses: { none: {} },
      },
    ],
  };
}
