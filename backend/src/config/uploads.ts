import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BACKEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Physical folder inside the backend app — only course materials & proofs live here. */
export const UPLOADS_DIR = path.join(BACKEND_ROOT, "uploads");

/**
 * Public URL segment after the API base (cPanel: https://domain.in/backend/uploads/…).
 * Express strips the `/backend` prefix before matching this route.
 */
export const UPLOAD_URL_PREFIX = "/uploads";

/** PPT, PDF, images, video, and Word docs only. */
export const ALLOWED_UPLOAD_MIMES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const ALLOWED_UPLOAD_EXTENSIONS = new Set([
  ".pdf",
  ".ppt",
  ".pptx",
  ".doc",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".mp4",
  ".mov",
]);

export function ensureUploadsDir(): void {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export function buildUploadUrl(filename: string): string {
  return `${UPLOAD_URL_PREFIX}/${filename}`;
}

export function filenameFromUploadUrl(fileUrl: string): string | null {
  const trimmed = fileUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const u = new URL(trimmed);
      const pathname = u.pathname;
      const prefix = `${UPLOAD_URL_PREFIX}/`;
      const idx = pathname.indexOf(prefix);
      const segment =
        idx >= 0 ? pathname.slice(idx + prefix.length) : pathname.split("/").filter(Boolean).pop();
      return segment ? decodeURIComponent(segment) : null;
    } catch {
      return null;
    }
  }

  const normalized = trimmed.replace(/^\/+/, "");
  if (!normalized.startsWith(`uploads/`)) return null;
  const name = normalized.slice("uploads/".length).split("/").filter(Boolean).pop();
  return name ? decodeURIComponent(name) : null;
}

export function isAllowedUploadMime(mimetype: string): boolean {
  return (ALLOWED_UPLOAD_MIMES as readonly string[]).includes(mimetype);
}

export function isAllowedUploadExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_UPLOAD_EXTENSIONS.has(ext);
}

export function materialTypeFromMime(mimetype: string): string {
  if (mimetype.includes("pdf")) return "PDF";
  if (mimetype.includes("presentation") || mimetype.includes("powerpoint")) return "PPT";
  if (mimetype.includes("video")) return "VIDEO";
  if (mimetype.includes("image")) return "IMAGE";
  if (mimetype.includes("document") || mimetype.includes("msword")) return "DOC";
  return "DOC";
}
