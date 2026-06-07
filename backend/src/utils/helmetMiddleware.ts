import type { RequestHandler } from "express";
import { cjsImport } from "./cjsImport.js";

const helmet = cjsImport<(options?: Record<string, unknown>) => RequestHandler>("helmet");

export default helmet;
