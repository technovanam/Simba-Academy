import path from "node:path";
import fs from "node:fs/promises";
import { env } from "../config/env.js";
import { NotFoundError } from "../utils/errors.js";

const storagePath = path.resolve(env.STORAGE_PATH);

/**
 * Resolves the full file path for a given filename.
 */
function getFilePath(filename: string): string {
  return path.join(storagePath, filename);
}

/**
 * Lists all files in storage.
 */
export async function listFiles(): Promise<string[]> {
  const files = await fs.readdir(storagePath);
  return files;
}

/**
 * Gets file metadata.
 */
export async function getFileInfo(filename: string) {
  const filePath = getFilePath(filename);
  try {
    const stats = await fs.stat(filePath);
    return {
      name: filename,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
    };
  } catch {
    throw new NotFoundError(`File "${filename}"`);
  }
}

/**
 * Deletes a file from storage.
 */
export async function deleteFile(filename: string): Promise<void> {
  const filePath = getFilePath(filename);
  try {
    await fs.unlink(filePath);
  } catch {
    throw new NotFoundError(`File "${filename}"`);
  }
}

/**
 * Gets the absolute path to a file for serving.
 */
export function getFileAbsolutePath(filename: string): string {
  return getFilePath(filename);
}
