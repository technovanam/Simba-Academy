import { prisma } from "./src/config/database.ts";

async function main() {
  try {
    const books = await prisma.storyBook.findMany();
    console.log("StoryBooks found:");
    for (const b of books) {
      console.log(`- Title: "${b.title}", FileUrl: "${b.fileUrl}", ID: "${b.id}"`);
    }
  } catch (err) {
    console.error("Error querying storybooks:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
