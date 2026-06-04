/**
 * Verifies media storage: local uploads dir or cPanel WebDAV (when USE_WEBDAV=true).
 * Run from backend/: node scripts/check-storage.mjs
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import https from "node:https";

const USE_WEBDAV = process.env.USE_WEBDAV === "true";
const STORAGE_PATH = process.env.STORAGE_PATH ?? "uploads";
const WEBDAV_URL = (process.env.WEBDAV_URL ?? "").replace(/\/$/, "");
const WEBDAV_USER = process.env.WEBDAV_USER ?? "";
const WEBDAV_PASSWORD = process.env.WEBDAV_PASSWORD ?? "";
const WEBDAV_BASE_URL = (process.env.WEBDAV_BASE_URL ?? "").replace(/\/$/, "");

const agent = new https.Agent({ rejectUnauthorized: false });

function webdavRequest(targetUrl, method, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(targetUrl);
    const req = https.request(
      { hostname: u.hostname, port: u.port, path: u.pathname + u.search, method, headers, agent },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, text: Buffer.concat(chunks).toString("utf8") }));
      }
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function checkLocal() {
  const dir = path.resolve(STORAGE_PATH);
  await fs.mkdir(dir, { recursive: true });
  const testName = `_storage-check-${Date.now()}.txt`;
  const testPath = path.join(dir, testName);
  await fs.writeFile(testPath, "simba-storage-check");
  await fs.access(testPath);
  await fs.unlink(testPath);
  console.log(`OK local storage: ${dir}`);
  return { mode: "local", path: dir };
}

async function checkWebdav() {
  if (!WEBDAV_PASSWORD) {
    throw new Error("USE_WEBDAV=true but WEBDAV_PASSWORD is empty");
  }
  const testName = `_storage-check-${Date.now()}.txt`;
  const payload = Buffer.from("simba-storage-check");
  const auth = "Basic " + Buffer.from(`${WEBDAV_USER}:${WEBDAV_PASSWORD}`).toString("base64");
  const putUrl = `${WEBDAV_URL}/${encodeURIComponent(testName)}`;

  const put = await webdavRequest(putUrl, "PUT", {
    Authorization: auth,
    "Content-Type": "text/plain",
    "Content-Length": String(payload.length),
  }, payload);

  if (put.status < 200 || put.status >= 300) {
    throw new Error(`WebDAV PUT failed: ${put.status} ${put.text}`);
  }

  const head = await webdavRequest(putUrl, "HEAD", { Authorization: auth });
  if (head.status < 200 || head.status >= 300) {
    throw new Error(`WebDAV verify failed: ${head.status}`);
  }

  await webdavRequest(putUrl, "DELETE", { Authorization: auth });

  const publicUrl = `${WEBDAV_BASE_URL}/${testName}`;
  console.log(`OK WebDAV storage: ${WEBDAV_URL}`);
  console.log(`   Public base: ${WEBDAV_BASE_URL}`);
  return { mode: "webdav", publicBase: WEBDAV_BASE_URL, sampleUrlPattern: publicUrl };
}

async function main() {
  console.log("Simba Academy — storage check\n");
  console.log(`USE_WEBDAV=${USE_WEBDAV}`);

  const result = USE_WEBDAV ? await checkWebdav() : await checkLocal();
  console.log("\nMedia gallery & story library uploads use this storage when you upload from the admin dashboard.");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("Storage check FAILED:", err.message ?? err);
  process.exit(1);
});
