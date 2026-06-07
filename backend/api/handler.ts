import "dotenv/config";
import serverless from "serverless-http";
import type { Handler } from "@vercel/node";
import { app, initApp } from "../dist/app.js";

let wrapped: ReturnType<typeof serverless> | undefined;

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
