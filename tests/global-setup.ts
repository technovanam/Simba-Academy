import { config } from "dotenv";
import { resolve } from "node:path";

export default async function globalSetup() {
  config({ path: resolve("backend/.env") });

  if (!process.env.TEST_ADMIN_PASSWORD && process.env.DEFAULT_ADMIN_PASSWORD) {
    process.env.TEST_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD;
  }
  if (!process.env.TEST_ADMIN_EMAIL && process.env.DEFAULT_ADMIN_EMAIL) {
    process.env.TEST_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL;
  }
}
