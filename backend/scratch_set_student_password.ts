import bcrypt from "bcryptjs";
import { prisma } from "./src/config/database.ts";

async function main() {
  try {
    const hashedPassword = await bcrypt.hash("Password123!", 12);
    await prisma.user.update({
      where: { email: "sasitt61@gmail.com" },
      data: { password: hashedPassword, status: "ACTIVE" },
    });
    console.log("Password for sasitt61@gmail.com updated to Password123!");
  } catch (err) {
    console.error("Error setting password:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
