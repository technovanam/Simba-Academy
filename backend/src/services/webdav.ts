import fs from "node:fs/promises";
import https from "node:https";
import { env } from "../config/env.js";

// cPanel's Web Disk often presents a self-signed / hostname-mismatched cert on
// its custom port. We skip cert verification ONLY for these WebDAV requests via
// a dedicated agent — never globally (which would also weaken Razorpay/SMTP TLS).
export const webdavAgent = new https.Agent({ rejectUnauthorized: false });

interface WebDavResponse {
  status: number;
  text: string;
}

function webdavRequest(
  targetUrl: string,
  method: string,
  headers: Record<string, string>,
  body?: Buffer
): Promise<WebDavResponse> {
  return new Promise((resolve, reject) => {
    const u = new URL(targetUrl);
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method,
        headers,
        agent: webdavAgent,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () =>
          resolve({
            status: res.statusCode ?? 0,
            text: Buffer.concat(chunks).toString("utf8"),
          })
        );
      }
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

/**
 * Uploads a local file to cPanel Web Disk (WebDAV) and returns its public URL.
 * 
 * @param localFilePath - Absolute path to the locally saved file.
 * @param filename - The name of the file to save on cPanel.
 * @returns Public HTTPS download URL.
 */
export async function uploadFileToWebDAV(localFilePath: string, filename: string): Promise<string> {
  if (!env.USE_WEBDAV) {
    throw new Error("WebDAV storage is disabled in configuration.");
  }

  if (!env.WEBDAV_PASSWORD) {
    throw new Error("WebDAV password is empty or not configured in env.");
  }

  const fileBuffer = await fs.readFile(localFilePath);
  const authHeader = "Basic " + Buffer.from(`${env.WEBDAV_USER}:${env.WEBDAV_PASSWORD}`).toString("base64");

  // Construct target URL (remove trailing slash if present)
  const webdavUrl = env.WEBDAV_URL.replace(/\/$/, "");
  const targetUrl = `${webdavUrl}/${encodeURIComponent(filename)}`;

  console.log(`📤 Uploading to cPanel Web Disk: ${filename}`);

  // Perform standard WebDAV PUT request
  const response = await webdavRequest(targetUrl, "PUT", {
    "Authorization": authHeader,
    "Content-Type": "application/octet-stream",
    "Content-Length": String(fileBuffer.length),
  }, fileBuffer);

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`WebDAV upload failed with status ${response.status}: ${response.text}`);
  }

  console.log(`✅ Successfully uploaded ${filename} to Web Disk`);

  await verifyFileOnWebDAV(filename);

  // Construct public download URL
  const baseUrl = env.WEBDAV_BASE_URL.replace(/\/$/, "");
  return `${baseUrl}/${filename}`;
}

/** Confirms the file is readable on WebDAV after upload (HEAD, or GET if HEAD unsupported). */
export async function verifyFileOnWebDAV(filename: string): Promise<void> {
  if (!env.USE_WEBDAV || !env.WEBDAV_PASSWORD) {
    throw new Error("WebDAV is not configured");
  }

  const webdavUrl = env.WEBDAV_URL.replace(/\/$/, "");
  const targetUrl = `${webdavUrl}/${encodeURIComponent(filename)}`;
  const authHeader = "Basic " + Buffer.from(`${env.WEBDAV_USER}:${env.WEBDAV_PASSWORD}`).toString("base64");

  let response = await webdavRequest(targetUrl, "HEAD", { Authorization: authHeader });

  if (response.status === 405 || response.status === 501 || response.status === 404) {
    response = await webdavRequest(targetUrl, "GET", { Authorization: authHeader });
  }

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Storage verification failed for ${filename} (HTTP ${response.status})`);
  }
}

/**
 * Deletes a file from cPanel Web Disk (WebDAV) using its public URL or filename.
 * 
 * @param fileUrl - The public URL of the file.
 */
export async function deleteFileFromWebDAV(fileUrl: string | null | undefined): Promise<void> {
  if (!fileUrl || !env.USE_WEBDAV) return;
  if (!env.WEBDAV_PASSWORD) return;

  // Extract filename from URL
  const filename = fileUrl.split("/").pop();
  if (!filename) return;

  // Construct target WebDAV URL
  const webdavUrl = env.WEBDAV_URL.replace(/\/$/, "");
  const targetUrl = `${webdavUrl}/${encodeURIComponent(filename)}`;

  console.log(`🗑️ Deleting from cPanel Web Disk: ${filename}`);

  const authHeader = "Basic " + Buffer.from(`${env.WEBDAV_USER}:${env.WEBDAV_PASSWORD}`).toString("base64");

  try {
    const response = await webdavRequest(targetUrl, "DELETE", {
      "Authorization": authHeader,
    });

    if ((response.status < 200 || response.status >= 300) && response.status !== 404) {
      console.error(`WebDAV delete failed with status ${response.status}: ${response.text}`);
    } else {
      console.log(`✅ Successfully deleted ${filename} from cPanel Web Disk`);
    }
  } catch (err) {
    console.error(`Error deleting file ${filename} from WebDAV:`, err);
  }
}
