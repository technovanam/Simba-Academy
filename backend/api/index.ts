import "dotenv/config";
import serverless from "serverless-http";
import type { Handler } from "@vercel/node";
import { app, initApp } from "../dist/app.js";

let handler: ReturnType<typeof serverless> | undefined;

const vercelHandler: Handler = async (req, res) => {
  await initApp();
  if (!handler) {
    handler = serverless(app);
  }
  return handler(req, res);
};

export default vercelHandler;
