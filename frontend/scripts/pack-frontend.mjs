import { execSync } from "node:child_process";
import { readFileSync, existsSync, writeFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND = resolve(__dirname, "..");
const REPO_ROOT = resolve(FRONTEND, "..");
const BUILD_CLIENT = resolve(FRONTEND, "build", "client");
const OUT_ZIP = resolve(REPO_ROOT, "simba-frontend.zip");

function run(cmd, env = process.env) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: FRONTEND, stdio: "inherit", shell: true, env });
}

function readApiUrlFromEnvFile(path) {
  if (!existsSync(path)) return null;
  const match = readFileSync(path, "utf8").match(/^VITE_API_URL=(.+)$/m);
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : null;
}

const prodEnv = resolve(FRONTEND, ".env.production");
const prodExample = resolve(FRONTEND, ".env.production.example");
if (!existsSync(prodEnv) && existsSync(prodExample)) {
  console.warn(
    "\n⚠️  No frontend/.env.production — copy .env.production.example and set VITE_API_URL before packing.\n"
  );
}

const apiUrl =
  process.env.VITE_API_URL ??
  readApiUrlFromEnvFile(prodEnv) ??
  readApiUrlFromEnvFile(resolve(FRONTEND, ".env"));

if (!apiUrl || /localhost|127\.0\.0\.1/i.test(apiUrl)) {
  console.error(
    "\n❌ VITE_API_URL must be your live API URL (not localhost).\n" +
      "   cp frontend/.env.production.example frontend/.env.production\n" +
      "   Then edit VITE_API_URL=https://yourdomain.in/backend\n"
  );
  process.exit(1);
}

console.log(`\n==> Building frontend for production (API: ${apiUrl})…`);
run("npm run build", { ...process.env, VITE_API_URL: apiUrl });

console.log("\n==> Creating zip from build/client…");
if (!existsSync(BUILD_CLIENT)) {
  console.error(`Error: Build directory not found at ${BUILD_CLIENT}`);
  process.exit(1);
}

writeFileSync(
  resolve(BUILD_CLIENT, "README-DEPLOY.txt"),
  [
    "Simba Academy Frontend — cPanel",
    "",
    "1. File Manager → public_html",
    "2. Upload & extract simba-frontend.zip here",
    "3. Ensure .htaccess is present for client-side routing",
    "4. API must be live at the URL baked into this build",
    "",
    "Full guide: DEPLOY-CPANEL.md in the repo (or simba-api.zip)",
  ].join("\n")
);

rmSync(OUT_ZIP, { force: true });
run(`tar -acf "${OUT_ZIP}" -C "${BUILD_CLIENT}" .`);

if (!existsSync(OUT_ZIP)) {
  console.error(`\n❌ Zip not created: ${OUT_ZIP}\n`);
  process.exit(1);
}

const sizeKb = Math.round(readFileSync(OUT_ZIP).length / 1024);
console.log(`\n✅ Ready: ${OUT_ZIP} (${sizeKb} KB)`);
console.log("Upload & extract into cPanel public_html.\n");
