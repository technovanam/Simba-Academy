import { prisma } from "../dist/config/database.js";

async function main() {
  const teacher = { studentClass: "LKG" };
  
  const classBooks = await prisma.storyBook.findMany({
    where: {
      category: teacher.studentClass,
      audience: { in: ["STUDENT", "BOTH"] },
    },
    select: {
      id: true,
      title: true,
      author: true,
      category: true,
      fileUrl: true,
    },
  });
  console.log("Class Books found:", classBooks.length, classBooks);

  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      studentClass: teacher.studentClass,
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      notifications: {
        where: {
          type: "STORY_BOOK",
        },
        select: {
          isRead: true,
          storyBookId: true,
        },
      },
    },
  });

  const mappedStudents = students.map((student) => {
    const readBookIds = new Set(
      student.notifications
        .filter((n) => n.isRead && n.storyBookId)
        .map((n) => n.storyBookId)
    );

    const booksProgress = classBooks.map((book) => ({
      id: book.id,
      title: book.title,
      isRead: readBookIds.has(book.id),
    }));

    return {
      name: student.name,
      email: student.email,
      booksCount: booksProgress.length,
      books: booksProgress,
    };
  });

  console.log("Mapped Students:", JSON.stringify(mappedStudents, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
