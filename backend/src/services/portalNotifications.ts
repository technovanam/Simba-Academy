import type { LessonPlan, StoryBook, Task, User } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../config/database.js";
import { sendPortalNotificationEmail } from "./portalEmails.js";

type Recipient = Pick<User, "id" | "name" | "email">;

const studentLibraryUrl = `${env.FRONTEND_URL}/student/library`;
const teacherTasksUrl = `${env.FRONTEND_URL}/teacher/tasks`;
const teacherLibraryUrl = `${env.FRONTEND_URL}/teacher/library`;
const teacherPlannerUrl = `${env.FRONTEND_URL}/teacher/planner`;

async function emailRecipients(recipients: Recipient[], send: (user: Recipient) => Promise<void>) {
  await Promise.allSettled(recipients.map((user) => send(user)));
}

/** Notify students whose class matches a newly published story book. */
export async function notifyStudentsOfNewStoryBook(book: StoryBook): Promise<number> {
  if (book.audience === "TEACHER") {
    return 0;
  }

  const classes = book.category.split(",").map((c) => c.trim()).filter(Boolean);

  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      status: "ACTIVE",
      isDeleted: false,
      studentClass: { in: classes },
    },
    select: { id: true, name: true, email: true },
  });

  if (students.length === 0) {
    return 0;
  }

  const authorSuffix = book.author ? ` by ${book.author}` : "";
  const message = `"${book.title}"${authorSuffix} was added to your library.`;

  await prisma.studentNotification.createMany({
    data: students.map((student: Recipient) => ({
      userId: student.id,
      type: "STORY_BOOK",
      title: "New story book available",
      message,
      storyBookId: book.id,
    })),
  });

  await emailRecipients(students, (student) =>
    sendPortalNotificationEmail({
      to: student.email,
      subject: `New story book for ${book.category} — ${book.title}`,
      theme: "student",
      recipientName: student.name,
      headline: "New Story Book Available",
      intro: `A new story book has been published for your class (${book.category}). You can view and print it from your student portal.`,
      rows: [
        { label: "Title", value: book.title },
        ...(book.author ? [{ label: "Author", value: book.author }] : []),
        { label: "Class", value: book.category },
      ],
      ctaLabel: "Open Story Library",
      ctaUrl: studentLibraryUrl,
      footerNote: "You will also see this alert inside your portal notifications.",
    })
  );

  return students.length;
}

/** Notify students when an admin grants them access to a Google Drive file/folder. */
export async function notifyStudentsOfDriveAccess(fileId: string, title: string, targetClass: string | null): Promise<number> {
  const classes = targetClass ? targetClass.split(",").map((c) => c.trim()).filter(Boolean) : [];

  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      status: "ACTIVE",
      isDeleted: false,
      ...(classes.length > 0 ? { studentClass: { in: classes } } : {}),
    },
    select: { id: true, name: true, email: true },
  });

  if (students.length === 0) {
    return 0;
  }

  const message = `"${title}" was added to your library.`;

  await prisma.studentNotification.createMany({
    data: students.map((student: Recipient) => ({
      userId: student.id,
      type: "STORY_BOOK",
      title: "New story book available",
      message,
      fileId, // This is a Drive file, so we use fileId instead of storyBookId
    })),
  });

  await emailRecipients(students, (student) =>
    sendPortalNotificationEmail({
      to: student.email,
      subject: `New story book added — ${title}`,
      theme: "student",
      recipientName: student.name,
      headline: "New Story Book Available",
      intro: `An administrator has given you access to a new story book (${title}). You can view it from your student portal.`,
      rows: [
        { label: "Title", value: title },
        ...(targetClass ? [{ label: "Class", value: targetClass }] : []),
      ],
      ctaLabel: "Open Story Library",
      ctaUrl: studentLibraryUrl,
      footerNote: "You will also see this alert inside your portal notifications.",
    })
  );

  return students.length;
}

/** Notify all active teachers when a story book is added for the teacher library. */
export async function notifyTeachersOfNewStoryBook(book: StoryBook): Promise<number> {
  if (book.audience === "STUDENT") {
    return 0;
  }

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER", status: "ACTIVE", isDeleted: false },
    select: { id: true, name: true, email: true },
  });

  if (teachers.length === 0) {
    return 0;
  }

  const authorSuffix = book.author ? ` by ${book.author}` : "";
  const message = `"${book.title}"${authorSuffix} (${book.category}) was added to the story library.`;

  await prisma.teacherNotification.createMany({
    data: teachers.map((teacher: Recipient) => ({
      userId: teacher.id,
      type: "STORY_BOOK",
      title: "New story book in library",
      message,
      storyBookId: book.id,
    })),
  });

  await emailRecipients(teachers, (teacher) =>
    sendPortalNotificationEmail({
      to: teacher.email,
      subject: `New story book added — ${book.title}`,
      theme: "teacher",
      recipientName: teacher.name,
      headline: "Story Library Updated",
      intro: "Administrators have added a new story book to the teacher library. You can view and print it from your portal.",
      rows: [
        { label: "Title", value: book.title },
        ...(book.author ? [{ label: "Author", value: book.author }] : []),
        { label: "Class", value: book.category },
      ],
      ctaLabel: "Browse Story Library",
      ctaUrl: teacherLibraryUrl,
      footerNote: "This update is also available in your in-portal notifications.",
    })
  );

  return teachers.length;
}

export async function notifyTeacherOfNewTask(
  teacher: Recipient,
  task: Pick<Task, "id" | "title" | "description" | "dueDate">
): Promise<void> {
  const dueLabel = task.dueDate
    ? task.dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "Not set";

  const message = `New task assigned: "${task.title}"${task.dueDate ? ` — due ${dueLabel}` : ""}.`;

  await prisma.teacherNotification.create({
    data: {
      userId: teacher.id,
      type: "TASK",
      title: "New task assigned",
      message,
      taskId: task.id,
    },
  });

  await sendPortalNotificationEmail({
    to: teacher.email,
    subject: `New task assigned — ${task.title}`,
    theme: "teacher",
    recipientName: teacher.name,
    headline: "New Task Assigned",
    intro: "An administrator has assigned you a new task. Please review the details and submit proof when complete.",
    rows: [
      { label: "Task", value: task.title },
      { label: "Description", value: task.description?.trim() || "—" },
      { label: "Due date", value: dueLabel },
    ],
    ctaLabel: "View Assigned Tasks",
    ctaUrl: teacherTasksUrl,
    footerNote: "You can track this task from your teacher portal notifications.",
  });
}

export async function notifyTeacherOfTaskReview(
  teacher: Recipient,
  task: Pick<Task, "id" | "title">,
  status: string,
  feedback?: string | null
): Promise<void> {
  const approved = status === "APPROVED";
  const message = `Task "${task.title}" was ${status.toLowerCase()}${feedback ? `: ${feedback}` : "."}`;

  await prisma.teacherNotification.create({
    data: {
      userId: teacher.id,
      type: "TASK_REVIEW",
      title: approved ? "Task approved" : "Task needs attention",
      message,
      taskId: task.id,
    },
  });

  await sendPortalNotificationEmail({
    to: teacher.email,
    subject: `Task review — ${task.title} [${status}]`,
    theme: "teacher",
    recipientName: teacher.name,
    headline: approved ? "Task Approved" : "Task Review Update",
    intro: approved
      ? "Your submitted task proof has been approved by the administrator."
      : "Your task proof has been reviewed. Please check the feedback and resubmit if needed.",
    rows: [
      { label: "Task", value: task.title },
      { label: "Status", value: status },
      { label: "Feedback", value: feedback?.trim() || "No additional feedback provided." },
    ],
    ctaLabel: "Open Assigned Tasks",
    ctaUrl: teacherTasksUrl,
  });
}

export async function notifyTeachersOfNewLessonPlan(
  plan: LessonPlan & { course?: { title: string; level: string } | null }
): Promise<number> {
  if (!plan.isPublished) {
    return 0;
  }

  const teachers = await prisma.user.findMany({
    where: {
      role: "TEACHER",
      status: "ACTIVE",
      isDeleted: false,
      ...(plan.targetClass
        ? {
            studentClass: {
              in: plan.targetClass
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean),
            },
          }
        : {}),
    },
    select: { id: true, name: true, email: true },
  });

  if (teachers.length === 0) {
    return 0;
  }

  const planDateLabel = plan.planDate
    ? plan.planDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "Flexible";

  const message = `New lesson plan published: "${plan.title}".`;

  await prisma.teacherNotification.createMany({
    data: teachers.map((teacher: Recipient) => ({
      userId: teacher.id,
      type: "LESSON_PLAN",
      title: "New lesson plan published",
      message,
      lessonPlanId: plan.id,
    })),
  });

  await emailRecipients(teachers, (teacher) =>
    sendPortalNotificationEmail({
      to: teacher.email,
      subject: `New lesson plan — ${plan.title}`,
      theme: "teacher",
      recipientName: teacher.name,
      headline: "Lesson Plan Published",
      intro: "A new lesson plan is now available in your teacher portal. You can view and print it for your classes.",
      rows: [
        { label: "Plan", value: plan.title },
        ...(plan.course?.title ? [{ label: "Course", value: plan.course.title }] : []),
        { label: "Plan date", value: planDateLabel },
      ],
      ctaLabel: "Open Lesson Planner",
      ctaUrl: teacherPlannerUrl,
      footerNote: "This alert is also listed under Notifications in your teacher portal.",
    })
  );

  return teachers.length;
}
