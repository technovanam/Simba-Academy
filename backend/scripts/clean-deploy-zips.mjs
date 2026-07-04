import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");

const NAMES = new Set(["simba-api.zip", "simba-frontend.zip", "simba-backend.zip"]);

function removeZips(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "node_modules" || name === ".git") continue;
      removeZips(full);
      continue;
    }
    if (name.endsWith(".zip") && (NAMES.has(name) || dir === REPO_ROOT)) {
      rmSync(full, { force: true });
      console.log(`Removed ${full}`);
    }
  }
}

removeZips(REPO_ROOT);
console.log("Deploy zip cleanup done.");
