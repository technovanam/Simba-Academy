import { createRequire } from "node:module";
import type { RequestHandler } from "express";

const require = createRequire(import.meta.url);

type HelmetFactory = (options?: Record<string, unknown>) => RequestHandler;

/** CJS require avoids ESM/default-export type issues on Vercel's TypeScript check. */
const helmet = require("helmet") as HelmetFactory;

export default helmet;
