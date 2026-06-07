/**
 * Build and pack backend for cPanel upload.
 * Usage: npm run deploy:pack  →  backend/deploy/simba-api.zip
 */
import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND = resolve(__dirname, "..");
const STAGING = join(BACKEND, "deploy", "simba-api");
const OUT_ZIP = join(BACKEND, "deploy", "simba-api.zip");

const INCLUDE = [
  "dist",
  "prisma",
  "scripts/cpanel-deploy.sh",
  "scripts/check-db.mjs",
  "package.json",
  "package-lock.json",
  "prisma.config.ts",
  ".env.production.example",
  "DEPLOY-CPANEL.md",
];

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: BACKEND, stdio: "inherit", shell: true });
}

console.log("\n==> Building backend…");
run("npm run build");
run("npx prisma generate");

console.log("\n==> Staging deploy bundle…");
rmSync(join(BACKEND, "deploy"), { recursive: true, force: true });
mkdirSync(STAGING, { recursive: true });

for (const rel of INCLUDE) {
  const src = join(BACKEND, rel);
  const dest = join(STAGING, rel);
  if (!existsSync(src)) {
    console.warn(`Skip missing: ${rel}`);
    continue;
  }
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true });
}

mkdirSync(join(STAGING, "data"), { recursive: true });
writeFileSync(join(STAGING, "data", ".gitkeep"), "");
mkdirSync(join(STAGING, "uploads"), { recursive: true });
writeFileSync(join(STAGING, "uploads", ".gitkeep"), "");

writeFileSync(
  join(STAGING, "README-DEPLOY.txt"),
  [
    "Simba Academy API — cPanel deploy bundle",
    "",
    "1. Extract this folder into your cPanel Node.js application root (e.g. /home/simbapre/api)",
    "2. Copy .env.production.example to .env and fill secrets",
    "3. SSH or Terminal: bash scripts/cpanel-deploy.sh",
    "4. cPanel → Setup Node.js App → Restart",
    "5. curl https://api.simbapreschool.in/api/health",
    "",
    "Full guide: DEPLOY-CPANEL.md",
  ].join("\n")
);

console.log("\n==> Creating zip…");
if (process.platform === "win32") {
  run(
    `powershell -NoProfile -Command "Compress-Archive -Path '${STAGING.replace(/'/g, "''")}\\*' -DestinationPath '${OUT_ZIP.replace(/'/g, "''")}' -Force"`
  );
} else {
  run(`cd deploy && zip -r simba-api.zip simba-api`);
}

const sizeKb = Math.round(readFileSync(OUT_ZIP).length / 1024);
console.log(`\n✅ Ready: ${OUT_ZIP} (${sizeKb} KB)`);
console.log("Upload to cPanel File Manager → extract → follow README-DEPLOY.txt\n");
