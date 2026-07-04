/**
 * Upgrade an existing live database after uploading a new simba-api.zip.
 * Safe to re-run — adds missing tables/columns only; does NOT delete your data.
 *
 * cPanel → Setup Node.js App → Run JS script → scripts/cpanel-migrate-only.mjs
 */
import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

process.env.NODE_ENV = process.env.NODE_ENV ?? "production";
process.env.NODE_PATH = "";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit", shell: true });
}

console.log("Simba API — schema upgrade only (keeps existing data)\n");

run("node node_modules/prisma/build/index.js db push");
run("node scripts/migrate-schema.mjs");

console.log("\n✅ Migration complete. Restart the Node.js app in cPanel.");
