import bcrypt from "bcryptjs";
import { prisma } from "./database.js";
import { env } from "./env.js";

export async function ensureDefaultAdmin(): Promise<void> {
  const email = env.DEFAULT_ADMIN_EMAIL.toLowerCase();
  const password = env.DEFAULT_ADMIN_PASSWORD || "Simba@123!@#";

  if (!password) {
    console.warn(
      "⚠️  DEFAULT_ADMIN_PASSWORD not set — skipping default admin seed. " +
        "Set it in the environment to bootstrap the admin account."
    );
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        name: "Simba Admin",
        email,
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    console.log(`✅ Default admin account ready`);
    return;
  }

  if (existing.role !== "ADMIN") {
    await prisma.user.update({
      where: { email },
      data: { role: "ADMIN", status: "ACTIVE" },
    });
    console.log(`✅ Existing user promoted to admin`);
  }

  if (env.SYNC_DEFAULT_ADMIN_PASSWORD) {
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
    console.log(`✅ Default admin password synced`);
  }
}

if (process.argv[1]?.includes("seedAdmin")) {
  ensureDefaultAdmin()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
