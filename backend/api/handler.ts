import "dotenv/config";
import { createRequire } from "node:module";
import type { Handler } from "@vercel/node";
import type { Express } from "express";
import { app, initApp } from "../dist/app.js";

const require = createRequire(import.meta.url);

type ServerlessHttp = (
  application: Express,
  options?: { binary?: string[] }
) => Handler;

const serverless = require("serverless-http") as ServerlessHttp;

let wrapped: Handler | undefined;

export const vercelHandler: Handler = async (req, res) => {
  await initApp();
  if (!wrapped) {
    wrapped = serverless(app, {
      binary: [
        "application/pdf",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "image/*",
        "video/*",
      ],
    });
  }
  return wrapped(req, res);
};

export default vercelHandler;
