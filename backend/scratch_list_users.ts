import { prisma } from "./src/config/database.ts";

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });
    console.log("Users found:");
    for (const u of users) {
      console.log(`- Name: "${u.name}", Email: "${u.email}", Role: "${u.role}", ID: "${u.id}"`);
    }
  } catch (err) {
    console.error("Error querying users:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
