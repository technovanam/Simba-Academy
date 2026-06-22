import { google } from "googleapis";
import { env } from "../config/env.js";
import fs from "node:fs/promises";
import { AppError } from "../utils/errors.js";
import stream from "node:stream";

let driveInstance: any = null;

// In-memory cache for folder descendant checks (1 hour TTL)
const folderAccessCache = new Map<string, { allowed: boolean; expiry: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

export async function getDriveClient() {
  if (driveInstance) return driveInstance;

  const credentialsStringOrPath = env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credentialsStringOrPath) {
    throw new AppError("Google service account credentials are not configured", 500);
  }

  let credentials: any;
  try {
    if (credentialsStringOrPath.trim().startsWith("{")) {
      credentials = JSON.parse(credentialsStringOrPath);
    } else {
      const fileContent = await fs.readFile(credentialsStringOrPath, "utf-8");
      credentials = JSON.parse(fileContent);
    }
  } catch (err: any) {
    throw new AppError(`Failed to load Google Service Account JSON: ${err.message}`, 500);
  }

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  driveInstance = google.drive({ version: "v3", auth });
  return driveInstance;
}

/**
 * Checks recursively if a folder ID is a descendant of the configured root folder.
 */
export async function checkIsDescendant(folderId: string): Promise<boolean> {
  const rootId = env.GOOGLE_DRIVE_FOLDER_ID;
  if (!rootId || rootId === "your_google_drive_folder_id_here") {
    // If root ID is placeholder, allow local test access, but log warning
    console.warn("⚠️ GOOGLE_DRIVE_FOLDER_ID is set to placeholder value. Enforcing check as true for local testing.");
    return true;
  }

  if (folderId === rootId) return true;

  // Check cache
  const cached = folderAccessCache.get(folderId);
  if (cached && cached.expiry > Date.now()) {
    return cached.allowed;
  }

  const drive = await getDriveClient();
  let currentId = folderId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === rootId) {
      folderAccessCache.set(folderId, { allowed: true, expiry: Date.now() + CACHE_TTL_MS });
      return true;
    }
    if (visited.has(currentId)) break;
    visited.add(currentId);

    try {
      const res = await drive.files.get({
        fileId: currentId,
        fields: "parents",
      });
      const parents = res.data.parents;
      if (!parents || parents.length === 0) break;
      currentId = parents[0]!;
    } catch (err: any) {
      console.error(`Error verifying folder descendant structure: ${err.message}`);
      break;
    }
  }

  folderAccessCache.set(folderId, { allowed: false, expiry: Date.now() + CACHE_TTL_MS });
  return false;
}

/**
 * Lists or searches files and folders.
 */
export async function listItems(folderId?: string | null, search?: string, type?: string) {
  const drive = await getDriveClient();
  const rootId = env.GOOGLE_DRIVE_FOLDER_ID;
  const targetFolderId = folderId && folderId !== "root" ? folderId : rootId;

  // Verify access permissions
  const isAllowed = await checkIsDescendant(targetFolderId);
  if (!isAllowed) {
    throw new AppError("Access denied to this folder", 403);
  }

  let q = `trashed = false`;
  if (search) {
    q += ` and name contains '${search.replace(/'/g, "\\'")}'`;
  } else {
    q += ` and '${targetFolderId}' in parents`;
  }

  if (type) {
    if (type === "folder") {
      q += ` and mimeType = 'application/vnd.google-apps.folder'`;
    } else if (type === "pdf") {
      q += ` and mimeType = 'application/pdf'`;
    } else if (type === "document") {
      q += ` and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/msword' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')`;
    } else if (type === "presentation") {
      q += ` and (mimeType = 'application/vnd.google-apps.presentation' or mimeType = 'application/vnd.ms-powerpoint' or mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation')`;
    } else if (type === "image") {
      q += ` and mimeType starts with 'image/'`;
    }
  }

  const res = await drive.files.list({
    q,
    fields: "files(id, name, mimeType, size, createdTime, parents, thumbnailLink)",
    orderBy: "folder, name",
  });

  let items = res.data.files || [];

  // Filter search results so only root descendants are returned
  if (search) {
    const filtered: any[] = [];
    for (const item of items) {
      if (item.parents && item.parents.length > 0) {
        const isItemAllowed = await checkIsDescendant(item.parents[0]!);
        if (isItemAllowed) {
          filtered.push(item);
        }
      }
    }
    items = filtered;
  }

  return items;
}

/**
 * Returns breadcrumb path parents for a given folder.
 */
export async function getAncestors(folderId: string) {
  const drive = await getDriveClient();
  const rootId = env.GOOGLE_DRIVE_FOLDER_ID;

  const isAllowed = await checkIsDescendant(folderId);
  if (!isAllowed) {
    throw new AppError("Access denied", 403);
  }

  const ancestors: Array<{ id: string; name: string; parentId: string | null }> = [];
  let currentId = folderId;
  const visited = new Set<string>();

  while (currentId && currentId !== rootId && !visited.has(currentId)) {
    visited.add(currentId);
    try {
      const res = await drive.files.get({
        fileId: currentId,
        fields: "id, name, parents",
      });
      const name = res.data.name!;
      const parents = res.data.parents;
      const parentId = parents && parents.length > 0 ? parents[0]! : null;

      ancestors.unshift({ id: currentId, name, parentId });
      currentId = parentId!;
    } catch (err: any) {
      console.error(`Error fetching ancestor metadata: ${err.message}`);
      break;
    }
  }

  return ancestors;
}

/**
 * Creates a folder.
 */
export async function createFolder(name: string, parentId?: string | null) {
  const drive = await getDriveClient();
  const rootId = env.GOOGLE_DRIVE_FOLDER_ID;
  const targetParentId = parentId && parentId !== "root" ? parentId : rootId;

  const isAllowed = await checkIsDescendant(targetParentId);
  if (!isAllowed) {
    throw new AppError("Access denied", 403);
  }

  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [targetParentId],
    },
    fields: "id, name, mimeType, createdTime",
  });

  return res.data;
}

/**
 * Uploads a file. Automatically converts Word and PPT files to Google format if requested.
 */
export async function uploadFile(
  file: { buffer: Buffer; originalname: string; mimetype: string },
  parentId?: string | null,
  convert = true
) {
  const drive = await getDriveClient();
  const rootId = env.GOOGLE_DRIVE_FOLDER_ID;
  const targetParentId = parentId && parentId !== "root" ? parentId : rootId;

  const isAllowed = await checkIsDescendant(targetParentId);
  if (!isAllowed) {
    throw new AppError("Access denied", 403);
  }

  let requestBodyMimeType: string | undefined = undefined;

  if (convert) {
    if (
      file.mimetype === "application/msword" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      requestBodyMimeType = "application/vnd.google-apps.document";
    } else if (
      file.mimetype === "application/vnd.ms-powerpoint" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ) {
      requestBodyMimeType = "application/vnd.google-apps.presentation";
    }
  }

  const bufferStream = new stream.PassThrough();
  bufferStream.end(file.buffer);

  const res = await drive.files.create({
    requestBody: {
      name: file.originalname,
      mimeType: requestBodyMimeType,
      parents: [targetParentId],
    },
    media: {
      mimeType: file.mimetype,
      body: bufferStream,
    },
    fields: "id, name, mimeType, size, createdTime",
  });

  return res.data;
}

/**
 * Renames a file/folder.
 */
export async function renameItem(id: string, name: string) {
  const drive = await getDriveClient();

  const resFile = await drive.files.get({
    fileId: id,
    fields: "parents",
  });
  const parents = resFile.data.parents;
  if (parents && parents.length > 0) {
    const isAllowed = await checkIsDescendant(parents[0]!);
    if (!isAllowed) throw new AppError("Access denied", 403);
  }

  const res = await drive.files.update({
    fileId: id,
    requestBody: {
      name,
    },
    fields: "id, name, mimeType, createdTime",
  });

  return res.data;
}

/**
 * Deletes a file/folder.
 */
export async function deleteItem(id: string) {
  const drive = await getDriveClient();

  const resFile = await drive.files.get({
    fileId: id,
    fields: "parents",
  });
  const parents = resFile.data.parents;
  if (parents && parents.length > 0) {
    const isAllowed = await checkIsDescendant(parents[0]!);
    if (!isAllowed) throw new AppError("Access denied", 403);
  }

  await drive.files.delete({
    fileId: id,
  });

  return { success: true };
}

/**
 * Downloads contents or exports docs as PDF and returns a stream.
 */
export async function getFileStream(id: string) {
  const drive = await getDriveClient();

  const resFile = await drive.files.get({
    fileId: id,
    fields: "name, mimeType, parents",
  });
  const { name, mimeType, parents } = resFile.data;
  if (parents && parents.length > 0) {
    const isAllowed = await checkIsDescendant(parents[0]!);
    if (!isAllowed) throw new AppError("Access denied", 403);
  }

  if (
    mimeType === "application/vnd.google-apps.document" ||
    mimeType === "application/vnd.google-apps.presentation"
  ) {
    const res = await drive.files.export(
      {
        fileId: id,
        mimeType: "application/pdf",
      },
      { responseType: "stream" }
    );
    return {
      stream: res.data,
      contentType: "application/pdf",
      filename: `${name!.replace(/\.[^/.]+$/, "")}.pdf`,
    };
  }

  const res = await drive.files.get(
    {
      fileId: id,
      alt: "media",
    },
    { responseType: "stream" }
  );

  return {
    stream: res.data,
    contentType: mimeType!,
    filename: name!,
  };
}

/**
 * Returns recently added documents.
 */
export async function getRecentDocuments() {
  const drive = await getDriveClient();
  const rootId = env.GOOGLE_DRIVE_FOLDER_ID;
  if (!rootId || rootId === "your_google_drive_folder_id_here") {
    // Return empty array if root ID is placeholder
    return [];
  }

  const res = await drive.files.list({
    q: `trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
    orderBy: "createdTime desc",
    pageSize: 10,
    fields: "files(id, name, mimeType, size, createdTime, parents, thumbnailLink)",
  });

  const items = res.data.files || [];
  const filtered: any[] = [];
  for (const item of items) {
    if (item.parents && item.parents.length > 0) {
      const isAllowed = await checkIsDescendant(item.parents[0]!);
      if (isAllowed) {
        filtered.push(item);
      }
    }
  }

  return filtered;
}
