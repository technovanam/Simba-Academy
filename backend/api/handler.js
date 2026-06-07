import "dotenv/config";
import { createRequire } from "node:module";
import { app, initApp } from "../dist/app.js";

const require = createRequire(import.meta.url);
const serverless = require("serverless-http");

/** @type {import("serverless-http").Handler | undefined} */
let wrapped;

/** @param {import("http").IncomingMessage} req @param {import("http").ServerResponse} res */
export default async function handler(req, res) {
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
}
