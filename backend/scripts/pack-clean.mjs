import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND = resolve(__dirname, "..");
const STAGING = join(BACKEND, "deploy", "backend-clean");
const OUT_ZIP = resolve(BACKEND, "..", "simba-backend.zip");

// Exclude these directories completely from copying
const EXCLUDE_DIRS = new Set([
  "node_modules",
  "dist",
  "deploy",
  ".git",
  "coverage",
]);

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: BACKEND, stdio: "inherit", shell: true });
}

function copyRecursive(src, dest) {
  if (!existsSync(src)) return;

  const st = statSync(src);
  if (st.isDirectory()) {
    const baseName = src.split(/[\\/]/).pop();
    if (EXCLUDE_DIRS.has(baseName)) {
      return;
    }

    mkdirSync(dest, { recursive: true });
    for (const childName of readdirSync(src)) {
      copyRecursive(join(src, childName), join(dest, childName));
    }
  } else {
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest);
  }
}

console.log("\n==> Staging entire backend (excluding node_modules, dist, and deploy)…");
rmSync(join(BACKEND, "deploy"), { recursive: true, force: true });
mkdirSync(STAGING, { recursive: true });

// Read the backend directory and copy everything except excluded dirs
const items = readdirSync(BACKEND);
for (const item of items) {
  if (EXCLUDE_DIRS.has(item)) continue;
  copyRecursive(join(BACKEND, item), join(STAGING, item));
}

console.log("\n==> Creating clean zip…");
if (process.platform === "win32") {
  run(
    `powershell -NoProfile -Command "Compress-Archive -Path '${STAGING.replace(/'/g, "''")}\\*' -DestinationPath '${OUT_ZIP.replace(/'/g, "''")}' -Force"`
  );
} else {
  run(`cd deploy && zip -r ../../simba-backend.zip backend-clean`);
}

// Clean up staging directory
rmSync(join(BACKEND, "deploy"), { recursive: true, force: true });

const sizeKb = Math.round(readFileSync(OUT_ZIP).length / 1024);
console.log(`\n✅ Ready: ${OUT_ZIP} (${sizeKb} KB)`);
console.log("Excluded: node_modules, dist, deploy, .git, coverage\n");
