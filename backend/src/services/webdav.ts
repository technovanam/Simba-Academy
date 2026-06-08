import fs from "node:fs/promises";
import https from "node:https";
import { env } from "../config/env.js";

// cPanel's Web Disk often presents a self-signed / hostname-mismatched cert on
// its custom port. We skip cert verification ONLY for these WebDAV requests via
// a dedicated agent — never globally (which would also weaken Razorpay/SMTP TLS).
export const webdavAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  maxSockets: 4,
});

const WEBDAV_TIMEOUT_MS = 120_000;
const WEBDAV_MAX_RETRIES = 2;

interface WebDavResponse {
  status: number;
  text: string;
}

function isRetryableNetworkError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as NodeJS.ErrnoException).code;
  return code === "ECONNRESET" || code === "ETIMEDOUT" || code === "EPIPE" || code === "ECONNREFUSED";
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
        port: u.port || 443,
        path: u.pathname + u.search,
        method,
        headers,
        agent: webdavAgent,
        timeout: WEBDAV_TIMEOUT_MS,
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
    req.on("timeout", () => {
      req.destroy(new Error(`WebDAV ${method} timed out after ${WEBDAV_TIMEOUT_MS}ms`));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function webdavRequestWithRetry(
  targetUrl: string,
  method: string,
  headers: Record<string, string>,
  body?: Buffer
): Promise<WebDavResponse> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= WEBDAV_MAX_RETRIES; attempt++) {
    try {
      return await webdavRequest(targetUrl, method, headers, body);
    } catch (err) {
      lastError = err;
      if (!isRetryableNetworkError(err) || attempt === WEBDAV_MAX_RETRIES) {
        throw err;
      }
      console.warn(`WebDAV ${method} retry ${attempt + 1}/${WEBDAV_MAX_RETRIES}:`, err);
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

function getAuthHeader(): string {
  return "Basic " + Buffer.from(`${env.WEBDAV_USER}:${env.WEBDAV_PASSWORD}`).toString("base64");
}

/**
 * Remote WebDAV folder relative to the account home directory.
 * e.g. WEBDAV_REMOTE_PATH=uploads → /home1/simapre/uploads on cPanel.
 */
export function getWebdavRemotePrefix(): string {
  const remote = env.WEBDAV_REMOTE_PATH.replace(/^\/+|\/+$/g, "");
  return remote ? `/${remote}` : "";
}

export function buildWebdavTargetUrl(filename: string): string {
  const webdavRoot = env.WEBDAV_URL.replace(/\/$/, "");
  const prefix = getWebdavRemotePrefix();
  const encodedName = encodeURIComponent(filename);
  return prefix ? `${webdavRoot}${prefix}/${encodedName}` : `${webdavRoot}/${encodedName}`;
}

function buildWebdavPublicUrl(filename: string): string {
  const baseUrl = env.WEBDAV_BASE_URL.replace(/\/$/, "");
  return `${baseUrl}/${encodeURIComponent(filename)}`;
}

async function ensureWebdavCollection(collectionUrl: string, authHeader: string): Promise<void> {
  const response = await webdavRequestWithRetry(collectionUrl, "MKCOL", {
    Authorization: authHeader,
  });

  if (
    response.status === 201 ||
    response.status === 405 ||
    response.status === 301 ||
    response.status === 302 ||
    response.status === 409
  ) {
    return;
  }

  if (response.status >= 200 && response.status < 300) {
    return;
  }

  throw new Error(`WebDAV MKCOL failed (${response.status}): ${response.text}`);
}

async function ensureWebdavPath(authHeader: string): Promise<void> {
  const prefix = getWebdavRemotePrefix();
  if (!prefix) return;

  const webdavRoot = env.WEBDAV_URL.replace(/\/$/, "");
  const segments = prefix.split("/").filter(Boolean);
  let current = webdavRoot;

  for (const segment of segments) {
    current = `${current}/${encodeURIComponent(segment)}`;
    await ensureWebdavCollection(current, authHeader);
  }
}

function isSuccessfulStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

async function putFileToWebdav(
  targetUrl: string,
  authHeader: string,
  fileBuffer: Buffer
): Promise<WebDavResponse> {
  return webdavRequestWithRetry(
    targetUrl,
    "PUT",
    {
      Authorization: authHeader,
      "Content-Type": "application/octet-stream",
      "Content-Length": String(fileBuffer.length),
    },
    fileBuffer
  );
}

/**
 * Uploads a local file to cPanel Web Disk (WebDAV) and returns its public URL.
 */
export async function uploadFileToWebDAV(localFilePath: string, filename: string): Promise<string> {
  if (!env.USE_WEBDAV) {
    throw new Error("WebDAV storage is disabled in configuration.");
  }

  if (!env.WEBDAV_PASSWORD) {
    throw new Error("WebDAV password is empty or not configured in env.");
  }

  const fileBuffer = await fs.readFile(localFilePath);
  const authHeader = getAuthHeader();
  const targetUrl = buildWebdavTargetUrl(filename);

  console.log(`📤 Uploading to cPanel Web Disk: ${targetUrl}`);

  await ensureWebdavPath(authHeader);

  let response = await putFileToWebdav(targetUrl, authHeader, fileBuffer);

  if (response.status === 409) {
    console.warn(`WebDAV 409 for ${filename}; removing existing file and retrying upload.`);
    await webdavRequestWithRetry(targetUrl, "DELETE", { Authorization: authHeader });
    response = await putFileToWebdav(targetUrl, authHeader, fileBuffer);
  }

  if (!isSuccessfulStatus(response.status)) {
    throw new Error(`WebDAV upload failed with status ${response.status}: ${response.text}`);
  }

  console.log(`✅ Successfully uploaded ${filename} to Web Disk`);

  try {
    await verifyFileOnWebDAV(filename);
  } catch (verifyErr) {
    console.warn(`WebDAV upload OK but verification skipped:`, verifyErr);
  }

  return buildWebdavPublicUrl(filename);
}

/** Confirms the file is readable on WebDAV after upload (HEAD, or GET if HEAD unsupported). */
export async function verifyFileOnWebDAV(filename: string): Promise<void> {
  if (!env.USE_WEBDAV || !env.WEBDAV_PASSWORD) {
    throw new Error("WebDAV is not configured");
  }

  const targetUrl = buildWebdavTargetUrl(filename);
  const authHeader = getAuthHeader();

  let response = await webdavRequestWithRetry(targetUrl, "HEAD", { Authorization: authHeader });

  if (response.status === 405 || response.status === 501 || response.status === 404) {
    response = await webdavRequestWithRetry(targetUrl, "GET", { Authorization: authHeader });
  }

  if (!isSuccessfulStatus(response.status)) {
    throw new Error(`Storage verification failed for ${filename} (HTTP ${response.status})`);
  }
}

/**
 * Deletes a file from cPanel Web Disk (WebDAV) using its public URL or filename.
 */
export async function deleteFileFromWebDAV(fileUrl: string | null | undefined): Promise<void> {
  if (!fileUrl || !env.USE_WEBDAV) return;
  if (!env.WEBDAV_PASSWORD) return;

  const filename = fileUrl.split("/").pop();
  if (!filename) return;

  const targetUrl = buildWebdavTargetUrl(decodeURIComponent(filename));

  console.log(`🗑️ Deleting from cPanel Web Disk: ${filename}`);

  const authHeader = getAuthHeader();

  try {
    const response = await webdavRequestWithRetry(targetUrl, "DELETE", {
      Authorization: authHeader,
    });

    if (!isSuccessfulStatus(response.status) && response.status !== 404) {
      console.error(`WebDAV delete failed with status ${response.status}: ${response.text}`);
    } else {
      console.log(`✅ Successfully deleted ${filename} from cPanel Web Disk`);
    }
  } catch (err) {
    console.error(`Error deleting file ${filename} from WebDAV:`, err);
  }
}
