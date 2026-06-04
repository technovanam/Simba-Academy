import fs from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import { env } from "../config/env.js";
import { webdavAgent } from "./webdav.js";

function filenameFromUrl(fileUrl: string): string | null {
  try {
    const u = new URL(fileUrl, "http://local");
    const name = u.pathname.split("/").filter(Boolean).pop();
    return name ? decodeURIComponent(name) : null;
  } catch {
    const parts = fileUrl.split("/").filter(Boolean);
    return parts.length ? decodeURIComponent(parts[parts.length - 1]!) : null;
  }
}

function contentTypeForFilename(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".ppt") || lower.endsWith(".pptx")) {
    return "application/vnd.ms-powerpoint";
  }
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) {
    return "application/msword";
  }
  return "application/octet-stream";
}

function fetchHttpsBuffer(url: string, useInsecureAgent: boolean): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { agent: useInsecureAgent ? webdavAgent : undefined }, (res) => {
        if ((res.statusCode ?? 0) >= 400) {
          reject(new Error(`Failed to fetch file (${res.statusCode})`));
          res.resume();
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

function fetchWebDavBuffer(filename: string): Promise<Buffer> {
  const webdavUrl = env.WEBDAV_URL.replace(/\/$/, "");
  const targetUrl = `${webdavUrl}/${encodeURIComponent(filename)}`;
  const authHeader =
    "Basic " + Buffer.from(`${env.WEBDAV_USER}:${env.WEBDAV_PASSWORD}`).toString("base64");

  return new Promise((resolve, reject) => {
    const u = new URL(targetUrl);
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: "GET",
        headers: { Authorization: authHeader },
        agent: webdavAgent,
      },
      (res) => {
        if ((res.statusCode ?? 0) >= 400) {
          reject(new Error(`WebDAV read failed (${res.statusCode})`));
          res.resume();
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      }
    );
    req.on("error", reject);
    req.end();
  });
}

export async function readLibraryFile(fileUrl: string): Promise<{
  buffer: Buffer;
  contentType: string;
  filename: string;
}> {
  const filename = filenameFromUrl(fileUrl) ?? "document.pdf";
  const contentType = contentTypeForFilename(filename);

  if (fileUrl.startsWith("/uploads/")) {
    const localName = fileUrl.replace(/^\/uploads\//, "");
    const localPath = path.resolve(env.STORAGE_PATH, localName);
    const buffer = await fs.readFile(localPath);
    return { buffer, contentType, filename: localName };
  }

  if (env.USE_WEBDAV && env.WEBDAV_PASSWORD) {
    const name = filenameFromUrl(fileUrl);
    if (name) {
      const buffer = await fetchWebDavBuffer(name);
      return { buffer, contentType, filename: name };
    }
  }

  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    const base = env.WEBDAV_BASE_URL.replace(/\/$/, "");
    const useInsecureAgent = env.USE_WEBDAV && fileUrl.startsWith(base);
    const buffer = await fetchHttpsBuffer(fileUrl, useInsecureAgent);
    return { buffer, contentType, filename };
  }

  throw new Error("Unsupported file location for library streaming");
}
