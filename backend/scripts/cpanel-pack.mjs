/**
 * Pack backend for cPanel upload (no node_modules).
 * Builds on YOUR PC — server only needs "Run NPM Install" (no Terminal).
 *
 * Usage: npm run deploy:pack  →  backend/deploy/simba-api.zip
 */
import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND = resolve(__dirname, "..");
const STAGING = join(BACKEND, "deploy", "simba-api");
const REPO_ROOT = resolve(BACKEND, "..");
const OUT_ZIP = resolve(REPO_ROOT, "simba-api.zip");

const INCLUDE = [
  "dist",
  "src",
  "prisma",
  "app.js",
  "scripts/cpanel-setup.mjs",
  "scripts/check-db.mjs",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "prisma.config.ts",
  ".env.production.example",
  ".npmrc",
];

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  "deploy",
  ".git",
  "uploads",
  "data",
  "coverage",
]);

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: BACKEND, stdio: "inherit", shell: true });
}

function copyPath(src, dest) {
  if (!existsSync(src)) {
    console.warn(`Skip missing: ${relative(BACKEND, src)}`);
    return;
  }
  const st = statSync(src);
  if (st.isDirectory()) {
    mkdirSync(dest, { recursive: true });
    for (const name of readdirSync(src)) {
      if (SKIP_DIR_NAMES.has(name)) continue;
      copyPath(join(src, name), join(dest, name));
    }
    return;
  }
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest);
}

console.log("\n==> Building on your PC (server has no Terminal)…");
run("npm run build");

console.log("\n==> Staging zip (includes dist + app.js, excludes node_modules)…");
rmSync(join(BACKEND, "deploy"), { recursive: true, force: true });
mkdirSync(STAGING, { recursive: true });

for (const rel of INCLUDE) {
  copyPath(join(BACKEND, rel), join(STAGING, rel));
}

const deployGuide = join(REPO_ROOT, "DEPLOY-CPANEL.md");
if (existsSync(deployGuide)) {
  copyPath(deployGuide, join(STAGING, "DEPLOY-CPANEL.md"));
}

const htaccessTemplate = join(BACKEND, "scripts", "public_html-backend.htaccess.template");
if (existsSync(htaccessTemplate)) {
  copyPath(htaccessTemplate, join(STAGING, "scripts", "public_html-backend.htaccess.template"));
}

console.log("\n==> Copying pre-generated Prisma client folders to backup…");
if (existsSync(join(BACKEND, "node_modules", "@prisma", "client"))) {
  copyPath(
    join(BACKEND, "node_modules", "@prisma", "client"),
    join(STAGING, "prisma-client-backup", "@prisma", "client")
  );
}
if (existsSync(join(BACKEND, "node_modules", ".prisma"))) {
  copyPath(
    join(BACKEND, "node_modules", ".prisma"),
    join(STAGING, "prisma-client-backup", ".prisma")
  );
}

mkdirSync(join(STAGING, "data"), { recursive: true });
writeFileSync(join(STAGING, "data", ".gitkeep"), "");
mkdirSync(join(STAGING, "uploads"), { recursive: true });
writeFileSync(join(STAGING, "uploads", ".gitkeep"), "");

writeFileSync(
  join(STAGING, "README-DEPLOY.txt"),
  [
    "Simba Academy API — cPanel (NO Terminal required)",
    "",
    "1. File Manager → extract into backend-api folder",
    "2. File Manager → copy .env.production.example → .env → edit secrets",
    "3. Setup Node.js App → Environment Variables (same as .env)",
    "4. Application startup file: app.js",
    "5. Click Run NPM Install",
    "6. Run JS script: scripts/cpanel-setup.mjs  (once — DB tables + admin)",
    "7. SAVE → Restart app",
    "8. Open: https://simbapreschool.in/backend/api/health",
    "",
    "Full guide: DEPLOY-CPANEL.md",
  ].join("\n")
);

console.log("\n==> Creating zip…");
rmSync(OUT_ZIP, { force: true });
run(`tar -acf "${OUT_ZIP}" -C "${STAGING}" .`);

if (!existsSync(OUT_ZIP)) {
  console.error(`\n❌ Zip not created: ${OUT_ZIP}`);
  console.error("Stop any running dev server (npm run dev) and try again.\n");
  process.exit(1);
}

const sizeKb = Math.round(readFileSync(OUT_ZIP).length / 1024);
console.log(`\n✅ Ready: ${OUT_ZIP} (${sizeKb} KB)`);
console.log("Excluded: node_modules only");
console.log("cPanel: startup file = app.js | Run NPM Install | Run scripts/cpanel-setup.mjs\n");
