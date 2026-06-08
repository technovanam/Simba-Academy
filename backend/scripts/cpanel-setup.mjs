/**
 * One-time setup from cPanel UI (no Terminal needed):
 * Setup Node.js App → Run JS script → scripts/cpanel-setup.mjs
 *
 * Creates DB tables + seeds admin (uses .env or Environment Variables).
 */
import { execSync } from "node:child_process";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, cpSync, chmodSync, lstatSync, readdirSync } from "node:fs";

// Clear NODE_PATH to prevent Node from resolving to broken global packages in cPanel nodevenv
process.env.NODE_PATH = "";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Automatically fix permissions for directories (755) and files (644) to avoid EACCES on cPanel
function fixPermissionsRecursive(dir) {
  if (!existsSync(dir)) return;
  try {
    cpSync(dir, dir); // touch
  } catch {}
  try {
    chmodSync(dir, 0o755);
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      const stats = lstatSync(fullPath);
      if (stats.isDirectory()) {
        fixPermissionsRecursive(fullPath);
      } else {
        chmodSync(fullPath, 0o644);
      }
    }
  } catch (err) {
    console.warn(`⚠️ Permission fix warning for ${dir}:`, err.message);
  }
}

console.log("Fixing staging folder permissions…");
fixPermissionsRecursive(resolve(root, "prisma-client-backup"));
fixPermissionsRecursive(resolve(root, "dist"));
fixPermissionsRecursive(resolve(root, "scripts"));

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit", shell: true });
}

console.log("Simba API — cPanel setup (database + admin seed)\n");

// Copy pre-built Prisma client into node_modules (which follows cPanel's node_modules symlink)
if (existsSync(resolve(root, "prisma-client-backup"))) {
  console.log("Installing pre-built Prisma Client into node_modules…");
  try {
    cpSync(
      resolve(root, "prisma-client-backup", "@prisma", "client"),
      resolve(root, "node_modules", "@prisma", "client"),
      { recursive: true }
    );
    cpSync(
      resolve(root, "prisma-client-backup", ".prisma"),
      resolve(root, "node_modules", ".prisma"),
      { recursive: true }
    );
    console.log("✅ Pre-built Prisma Client installed.");
  } catch (err) {
    console.warn("⚠️ Failed to copy pre-built Prisma client:", err.message);
  }
}

try {
  run("node node_modules/prisma/build/index.js generate");
} catch (err) {
  console.warn("⚠️ Prisma client generation skipped (using pre-built version from zip).");
}

try {
  run("node node_modules/prisma/build/index.js db push");
} catch (err) {
  console.warn("\n⚠️ Database push failed. If your database tables are not yet created, please configure Remote MySQL in cPanel and run 'npx prisma db push' locally from your PC.");
}

const { ensureDefaultAdmin } = await import("../dist/config/seedAdmin.js");
await ensureDefaultAdmin();

console.log("\n✅ Setup complete. Restart the Node.js app in cPanel.");
