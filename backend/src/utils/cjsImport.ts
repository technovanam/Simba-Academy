import { createRequire } from "node:module";

const nodeRequire = createRequire(import.meta.url);

/**
 * Load a CommonJS package under NodeNext + Vercel's TypeScript check.
 */
export function cjsImport<T>(moduleId: string): T {
  const loaded = nodeRequire(moduleId) as T | { default: T };
  if (typeof loaded === "function") {
    return loaded as T;
  }
  if (loaded && typeof loaded === "object" && "default" in loaded) {
    const nested = (loaded as { default: T }).default;
    if (nested !== undefined) {
      return nested as T;
    }
  }
  return loaded as T;
}
