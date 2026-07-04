import { rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

for (const dir of ["node_modules/.vite", "build"]) {
  try {
    rmSync(resolve(root, dir), { recursive: true, force: true });
    console.log(`Removed ${dir}`);
  } catch {
    /* ignore */
  }
}

console.log("Vite cache cleared.");
