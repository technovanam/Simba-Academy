import { env } from "../config/env.js";
import { deleteFile as deleteLocalFile } from "./storage.js";
import { deleteFileFromWebDAV } from "./webdav.js";

/** Extract stored filename from a public URL or `/uploads/...` path. */
export function extractStorageFilename(fileUrl: string): string | null {
  const trimmed = fileUrl.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const u = new URL(trimmed);
      const last = u.pathname.split("/").filter(Boolean).pop();
      return last ? decodeURIComponent(last) : null;
    }
  } catch {
    /* fall through */
  }

  const parts = trimmed.replace(/^\/+/, "").split("/").filter(Boolean);
  const last = parts.pop();
  return last ? decodeURIComponent(last) : null;
}

/**
 * Remove a file from WebDAV (production) and/or local storage (dev).
 * Safe to call when the file is already gone.
 */
export async function removeStoredFile(fileUrl: string | null | undefined): Promise<void> {
  if (!fileUrl?.trim()) return;

  if (env.USE_WEBDAV) {
    await deleteFileFromWebDAV(fileUrl);
  }

  const filename = extractStorageFilename(fileUrl);
  if (!filename) return;

  try {
    await deleteLocalFile(filename);
  } catch {
    // File may only exist on WebDAV or was already removed
  }
}

export async function removeStoredFiles(urls: (string | null | undefined)[]): Promise<void> {
  for (const url of urls) {
    await removeStoredFile(url);
  }
}
