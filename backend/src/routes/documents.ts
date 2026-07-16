import { Router } from "express";
import multer from "multer";
import { authenticate, authenticateFromHeaderOrQuery, authorize } from "../middleware/auth.js";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/errors.js";
import {
  listItems,
  getAncestors,
  createFolder,
  uploadFile,
  renameItem,
  deleteItem,
  getFileStream,
  getRecentDocuments,
  getDriveClient,
} from "../services/googleDriveService.js";
import { notifyStudentsOfDriveAccess, notifyTeachersOfDriveAccess } from "../services/portalNotifications.js";
import {
  getTeacherAssignedClasses,
  resolveActiveClassFilter,
  teacherMatchesAnyClass,
} from "../utils/teacherClasses.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const allRoles = authorize("ADMIN", "TEACHER", "STUDENT");
const adminOnly = authorize("ADMIN");

async function logActivity(userId: string | undefined, action: string, details: string) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        details,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

/**
 * Check if the user has access to a specific file or folder by inspecting
 * its own rules and all of its ancestor folders' rules recursively.
 */
async function getAllowedFolderIds(user: any, activeClasses: string[]): Promise<Set<string>> {
  const allowedFolderIds = new Set<string>();
  try {
    const rules = await prisma.driveAccessRule.findMany({
      where: {
        audience: { in: [user.role === "TEACHER" ? "TEACHER" : "STUDENT", "BOTH"] },
      }
    });

    const filteredRules = rules.filter(rule => {
      if (!rule.targetClass) return true;
      if (activeClasses.length === 0) return false;
      return teacherMatchesAnyClass(activeClasses, rule.targetClass);
    });

    const ancestorResults = await Promise.all(
      filteredRules.map(async (rule) => {
        try {
          const ancestors = await getAncestors(rule.fileId);
          return { fileId: rule.fileId, ancestors };
        } catch {
          return { fileId: rule.fileId, ancestors: [] as Awaited<ReturnType<typeof getAncestors>> };
        }
      })
    );

    for (const { fileId, ancestors } of ancestorResults) {
      for (const a of ancestors) {
        allowedFolderIds.add(a.id);
      }
      allowedFolderIds.add(fileId);
    }
  } catch (err) {
    console.error("Error gathering allowed folder IDs:", err);
  }
  return allowedFolderIds;
}

async function isExplicitlyAllowed(fileId: string | null, user: any, activeClasses: string[]): Promise<boolean> {
  if (!fileId || fileId === "root") return false;
  try {
    const ancestors = await getAncestors(fileId);
    const targetItem = ancestors.find((a) => a.id === fileId);
    const isFolder = targetItem ? targetItem.mimeType === "application/vnd.google-apps.folder" : false;

    // If it's not a folder, we only check the file itself. We don't check ancestor rules.
    const idsToCheck = isFolder
      ? [fileId, ...[...ancestors].reverse().map((a) => a.id)]
      : [fileId];

    const rules = await prisma.driveAccessRule.findMany({
      where: { fileId: { in: idsToCheck } },
    });

    let activeRule = null;
    for (const id of idsToCheck) {
      const rule = rules.find((r) => r.fileId === id);
      if (rule) {
        activeRule = rule;
        break;
      }
    }

    if (activeRule) {
      const audience = activeRule.audience;
      const targetClass = activeRule.targetClass;

      if (user.role === "TEACHER") {
        if (audience !== "BOTH" && audience !== "TEACHER") return false;
        if (targetClass && activeClasses.length > 0 && !teacherMatchesAnyClass(activeClasses, targetClass)) return false;
      } else if (user.role === "STUDENT") {
        if (audience !== "BOTH" && audience !== "STUDENT") return false;
        const studentClass = activeClasses[0] ?? null;
        if (targetClass && (!studentClass || !teacherMatchesAnyClass([studentClass], targetClass))) return false;
      }
      return true;
    }
  } catch (err) {
    console.error("Error verifying explicit access rules:", err);
  }
  return false;
}

/**
 * Check if the user has access to a specific file or folder by inspecting
 * its own rules and all of its ancestor folders' rules recursively.
 */
async function resolveUserActiveClasses(user: any, classQuery?: string): Promise<string[]> {
  if (user.role === "STUDENT") {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { studentClass: true },
    });
    return dbUser?.studentClass ? [dbUser.studentClass] : [];
  }
  if (user.role === "TEACHER") {
    const assigned = await getTeacherAssignedClasses(user.userId);
    if (classQuery) {
      return resolveActiveClassFilter(assigned, classQuery);
    }
    return assigned;
  }
  return [];
}

async function hasFolderAccess(
  fileId: string | null,
  user: any,
  classQuery?: string,
  allowedFolderIdsCache?: Set<string>
): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  if (!fileId || fileId === "root") return true;

  try {
    const activeClasses = await resolveUserActiveClasses(user, classQuery);

    const allowedFolderIds =
      allowedFolderIdsCache ?? (await getAllowedFolderIds(user, activeClasses));
    if (allowedFolderIds.has(fileId)) {
      return true;
    }

    return await isExplicitlyAllowed(fileId, user, activeClasses);
  } catch (err) {
    console.error("Error verifying folder access rules:", err);
    return false;
  }
}

/**
 * Filter items based on user role, class, and the stored DriveAccessRules.
 */
async function applyAccessControls(
  items: any[],
  user: any,
  folderId: string | null = null,
  classQuery?: string,
  allowedFolderIdsCache?: Set<string>
) {
  if (items.length === 0) return items;
  
  if (user.role === "ADMIN") {
    const itemIds = items.map((i) => i.id);
    const rules = await prisma.driveAccessRule.findMany({
      where: { fileId: { in: itemIds } },
    });
    const ruleMap = new Map();
    for (const rule of rules) {
      ruleMap.set(rule.fileId, rule);
    }
    for (const item of items) {
      const rule = ruleMap.get(item.id);
      if (rule) {
        item.accessRule = { audience: rule.audience, targetClass: rule.targetClass };
      } else {
        item.accessRule = null;
      }
    }
    return items;
  }

  const activeClasses = await resolveUserActiveClasses(user, classQuery);

  const allowedFolderIds =
    allowedFolderIdsCache ?? (await getAllowedFolderIds(user, activeClasses));

  const itemIds = items.map((i) => i.id);
  const rules = await prisma.driveAccessRule.findMany({
    where: { fileId: { in: itemIds } },
  });

  const ruleMap = new Map();
  for (const rule of rules) {
    ruleMap.set(rule.fileId, rule);
  }

  const result = [];
  for (const item of items) {
    const rule = ruleMap.get(item.id);

    if (rule) {
      const audience = rule.audience;
      const targetClass = rule.targetClass;
      item.accessRule = { audience, targetClass };

      if (user.role === "TEACHER") {
        if (audience === "BOTH" || audience === "TEACHER") {
          if (!targetClass || activeClasses.length === 0 || teacherMatchesAnyClass(activeClasses, targetClass)) {
            result.push(item);
          }
        }
      } else if (user.role === "STUDENT") {
        if (audience === "BOTH" || audience === "STUDENT") {
          const studentClass = activeClasses[0] ?? null;
          if (!targetClass || (studentClass && teacherMatchesAnyClass([studentClass], targetClass))) {
            result.push(item);
          }
        }
      }
    } else {
      if (allowedFolderIds.has(item.id)) {
        item.accessRule = { audience: "BOTH", targetClass: null };
        result.push(item);
      } else {
        const isFolder = item.mimeType === "application/vnd.google-apps.folder";
        if (isFolder) {
          const parentId = item.parents && item.parents.length > 0 ? item.parents[0] : folderId;
          const parentExplicitlyAllowed = await isExplicitlyAllowed(parentId, user, activeClasses);
          if (parentExplicitlyAllowed) {
            item.accessRule = { audience: "BOTH", targetClass: null };
            result.push(item);
          }
        }
      }
    }
  }

  return result;
}

/**
 * List files and folders in a directory, or search recursively.
 */
router.get("/browse", authenticate, allRoles, async (req, res, next) => {
  try {
    const folderId = typeof req.query.folderId === "string" ? req.query.folderId : null;
    const search = typeof req.query.search === "string" && req.query.search.trim().length > 0
      ? req.query.search.trim()
      : undefined;
    const type = typeof req.query.type === "string" && req.query.type.length > 0
      ? req.query.type
      : undefined;

    const classQuery = typeof req.query.class === "string" ? req.query.class : undefined;

    let allowedFolderIdsCache: Set<string> | undefined;
    if (req.user!.role !== "ADMIN") {
      const activeClasses = await resolveUserActiveClasses(req.user!, classQuery);
      allowedFolderIdsCache = await getAllowedFolderIds(req.user!, activeClasses);
    }

    // Verify access to folder hierarchy
    const allowed = await hasFolderAccess(folderId, req.user!, classQuery, allowedFolderIdsCache);
    if (!allowed) {
      throw new AppError("Access denied to this folder", 403);
    }

    const items = await listItems(folderId, search, type);
    const filteredItems = await applyAccessControls(
      items,
      req.user!,
      folderId,
      classQuery,
      allowedFolderIdsCache
    );
    res.json(filteredItems);
  } catch (err) {
    next(err);
  }
});

/**
 * Get folder path ancestors for breadcrumbs.
 */
router.get("/ancestors/:id", authenticate, allRoles, async (req, res, next) => {
  try {
    const allowed = await hasFolderAccess(req.params.id as string, req.user!);
    if (!allowed) {
      throw new AppError("Access denied", 403);
    }
    const ancestors = await getAncestors(req.params.id as string);
    res.json(ancestors);
  } catch (err) {
    next(err);
  }
});

/**
 * Lists recently modified files.
 */
router.get("/recent", authenticate, allRoles, async (req, res, next) => {
  try {
    const classQuery = typeof req.query.class === "string" ? req.query.class : undefined;
    const recent = await getRecentDocuments();
    const filteredRecent = await applyAccessControls(recent, req.user!, null, classQuery);
    res.json(filteredRecent);
  } catch (err) {
    next(err);
  }
});

/**
 * Get recent audit logs for document activity.
 */
router.get("/logs", authenticate, adminOnly, async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

/**
 * Streams document content (PDF/image) inline.
 * Exposes a query param token check so iframes can access it securely.
 */
router.get("/:id/view", authenticateFromHeaderOrQuery, allRoles, async (req, res, next) => {
  try {
    const fileId = req.params.id as string;

    const allowed = await hasFolderAccess(fileId, req.user!);
    if (!allowed) {
      throw new AppError("Access denied", 403);
    }

    const { stream, contentType, filename } = await getFileStream(fileId);

    const isDownload = req.user!.role === "ADMIN" && req.query.download === "1";
    const disposition = isDownload ? "attachment" : "inline";

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${filename.replace(/"/g, "")}"`
    );
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    if (!isDownload) {
      res.setHeader("Content-Security-Policy", "default-src 'none'");
    }

    await logActivity(
      req.user!.userId,
      isDownload ? "DOCUMENT_DOWNLOAD" : "DOCUMENT_VIEW",
      `Viewed or streamed document: ${filename} (ID: ${fileId})`
    );

    stream.pipe(res);
  } catch (err) {
    next(err);
  }
});

/**
 * Admin-only raw file download.
 */
router.get("/:id/download", authenticate, adminOnly, async (req, res, next) => {
  try {
    const fileId = req.params.id as string;
    const { stream, contentType, filename } = await getFileStream(fileId);

    const isDownload = req.user!.role === "ADMIN" && req.query.download === "1";
    const disposition = isDownload ? "attachment" : "inline";

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${filename.replace(/"/g, "")}"`
    );
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    if (!isDownload) {
      res.setHeader("Content-Security-Policy", "default-src 'none'");
    }

    await logActivity(
      req.user!.userId,
      isDownload ? "DOCUMENT_DOWNLOAD" : "DOCUMENT_VIEW",
      `Viewed or streamed document: ${filename} (ID: ${fileId})`
    );

    stream.pipe(res);
  } catch (err) {
    next(err);
  }
});

/**
 * Admin-only raw file download.
 */
router.get("/:id/download", authenticate, adminOnly, async (req, res, next) => {
  try {
    const fileId = req.params.id as string;
    const { stream, contentType, filename } = await getFileStream(fileId);

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename.replace(/"/g, "")}"`
    );

    await logActivity(
      req.user!.userId,
      "DOCUMENT_DOWNLOAD",
      `Downloaded file: ${filename} (ID: ${fileId})`
    );

    stream.pipe(res);
  } catch (err) {
    next(err);
  }
});

/**
 * Create folder.
 */
router.post("/folders", authenticate, adminOnly, async (req, res, next) => {
  try {
    const { name, parentId } = req.body;
    if (!name || name.trim().length === 0) {
      throw new AppError("Folder name is required", 400);
    }

    const folder = await createFolder(name.trim(), parentId);

    await logActivity(
      req.user!.userId,
      "DOCUMENT_FOLDER_CREATE",
      `Created folder: ${name} (ID: ${folder.id}) under parent ID: ${parentId || "root"}`
    );

    res.status(201).json(folder);
  } catch (err) {
    next(err);
  }
});

/**
 * Upload file to Google Drive.
 */
router.post("/upload", authenticate, adminOnly, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError("No file uploaded", 400);
    }

    const parentId = req.body.parentId;
    const convert = req.body.convert !== "false";

    const file = await uploadFile(req.file, parentId, convert);

    await logActivity(
      req.user!.userId,
      "DOCUMENT_UPLOAD",
      `Uploaded file: ${req.file.originalname} (ID: ${file.id}) under folder ID: ${parentId || "root"}`
    );

    res.status(201).json(file);
  } catch (err) {
    next(err);
  }
});

/**
 * Rename file/folder.
 */
router.patch("/:id", authenticate, adminOnly, async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      throw new AppError("New name is required", 400);
    }

    const item = await renameItem(req.params.id as string, name.trim());

    await logActivity(
      req.user!.userId,
      "DOCUMENT_RENAME",
      `Renamed item ID: ${req.params.id} to: ${name.trim()}`
    );

    res.json(item);
  } catch (err) {
    next(err);
  }
});

/**
 * Delete file/folder.
 */
router.delete("/:id", authenticate, adminOnly, async (req, res, next) => {
  try {
    const fileId = req.params.id as string;
    await deleteItem(fileId);

    // Also delete any associated access rules
    await prisma.driveAccessRule.deleteMany({
      where: { fileId },
    });

    await logActivity(
      req.user!.userId,
      "DOCUMENT_DELETE",
      `Deleted item ID: ${fileId}`
    );

    res.json({ success: true, message: "Item deleted successfully" });
  } catch (err) {
    next(err);
  }
});

/**
 * Bulk upsert access rules for multiple files/folders.
 */
router.put("/access/bulk", authenticate, adminOnly, async (req, res, next) => {
  try {
    const { items, audience, targetClass } = req.body as {
      items?: Array<{ fileId: string; title?: string }>;
      audience?: string;
      targetClass?: string | null;
    };

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError("At least one item is required", 400);
    }
    if (items.length > 100) {
      throw new AppError("You can update at most 100 items at once", 400);
    }

    const allowedAudiences = ["BOTH", "TEACHER", "STUDENT"];
    if (!audience || !allowedAudiences.includes(audience)) {
      throw new AppError("Invalid audience", 400);
    }

    const uniqueItems = new Map<string, { fileId: string; title?: string }>();
    for (const item of items) {
      if (!item?.fileId || typeof item.fileId !== "string") continue;
      uniqueItems.set(item.fileId, item);
    }
    if (uniqueItems.size === 0) {
      throw new AppError("At least one valid fileId is required", 400);
    }

    const fileIds = [...uniqueItems.keys()];
    const existingRules = await prisma.driveAccessRule.findMany({
      where: { fileId: { in: fileIds } },
    });
    const existingById = new Map(existingRules.map((r) => [r.fileId, r]));

    const rules = [];
    let shouldNotifyStudents = false;
    let shouldNotifyTeachers = false;
    let notifyTitle = "Story library items";

    for (const [fileId, item] of uniqueItems) {
      const existingRule = existingById.get(fileId);
      const title = item.title || existingRule?.title || "Untitled Document";

      const rule = await prisma.driveAccessRule.upsert({
        where: { fileId },
        update: {
          audience: audience as any,
          targetClass: targetClass || null,
          title,
        },
        create: {
          fileId,
          audience: audience as any,
          targetClass: targetClass || null,
          title,
        },
      });
      rules.push(rule);

      const nowHasStudents = audience === "BOTH" || audience === "STUDENT";
      const didnHaveStudents = !existingRule || existingRule.audience === "TEACHER";
      const classesChanged = existingRule && existingRule.targetClass !== (targetClass || null);
      const nowHasTeachers = audience === "BOTH" || audience === "TEACHER";
      const didnHaveTeachers = !existingRule || existingRule.audience === "STUDENT";

      if (nowHasStudents && (didnHaveStudents || classesChanged)) {
        shouldNotifyStudents = true;
        if (uniqueItems.size === 1) notifyTitle = title;
      }
      if (nowHasTeachers && (didnHaveTeachers || classesChanged)) {
        shouldNotifyTeachers = true;
        if (uniqueItems.size === 1) notifyTitle = title;
      }
    }

    if (uniqueItems.size > 1) {
      notifyTitle = `${uniqueItems.size} story library items`;
    }

    if (shouldNotifyStudents) {
      try {
        await notifyStudentsOfDriveAccess(fileIds[0]!, notifyTitle, targetClass || null);
      } catch (err) {
        console.error("Failed to notify students of bulk drive access:", err);
      }
    }
    if (shouldNotifyTeachers) {
      try {
        await notifyTeachersOfDriveAccess(notifyTitle, targetClass || null);
      } catch (err) {
        console.error("Failed to notify teachers of bulk drive access:", err);
      }
    }

    await logActivity(
      req.user!.userId,
      "DOCUMENT_ACCESS_BULK_UPDATE",
      `Updated access for ${rules.length} items to audience: ${audience}, class: ${targetClass || "ALL"}`
    );

    res.json({ rules, count: rules.length });
  } catch (err) {
    next(err);
  }
});

/**
 * Bulk revoke access rules for multiple files/folders.
 */
router.delete("/access/bulk", authenticate, adminOnly, async (req, res, next) => {
  try {
    const { fileIds } = req.body as { fileIds?: string[] };

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      throw new AppError("At least one fileId is required", 400);
    }
    if (fileIds.length > 100) {
      throw new AppError("You can revoke at most 100 items at once", 400);
    }

    const uniqueIds = [...new Set(fileIds.filter((id) => typeof id === "string" && id.length > 0))];
    if (uniqueIds.length === 0) {
      throw new AppError("At least one valid fileId is required", 400);
    }

    const result = await prisma.driveAccessRule.deleteMany({
      where: { fileId: { in: uniqueIds } },
    });

    await logActivity(
      req.user!.userId,
      "DOCUMENT_ACCESS_BULK_REVOKE",
      `Revoked access for ${result.count} items`
    );

    res.json({ success: true, count: result.count, message: "Access rules removed successfully" });
  } catch (err) {
    next(err);
  }
});

/**
 * Manage Access Rule for a file/folder
 */
router.put("/:id/access", authenticate, adminOnly, async (req, res, next) => {
  try {
    const fileId = req.params.id as string;
    const { audience, targetClass, title } = req.body;

    const allowedAudiences = ["BOTH", "TEACHER", "STUDENT"];
    if (!allowedAudiences.includes(audience)) {
      throw new AppError("Invalid audience", 400);
    }

    const existingRule = await prisma.driveAccessRule.findUnique({ where: { fileId } });

    const rule = await prisma.driveAccessRule.upsert({
      where: { fileId },
      update: {
        audience: audience as any,
        targetClass: targetClass || null,
        title: title || undefined,
      },
      create: {
        fileId,
        audience: audience as any,
        targetClass: targetClass || null,
        title: title || "Untitled Document",
      },
    });

    // Notify students if access is newly granted or classes changed
    const nowHasStudents = audience === "BOTH" || audience === "STUDENT";
    const didnHaveStudents = !existingRule || existingRule.audience === "TEACHER";
    const classesChanged = existingRule && existingRule.targetClass !== (targetClass || null);

    const nowHasTeachers = audience === "BOTH" || audience === "TEACHER";
    const didnHaveTeachers = !existingRule || existingRule.audience === "STUDENT";
    
    if (nowHasStudents && (didnHaveStudents || classesChanged)) {
      try {
        await notifyStudentsOfDriveAccess(fileId, rule.title, rule.targetClass);
      } catch (err) {
        console.error("Failed to notify students of drive access:", err);
      }
    }

    if (nowHasTeachers && (didnHaveTeachers || classesChanged)) {
      try {
        await notifyTeachersOfDriveAccess(rule.title, rule.targetClass);
      } catch (err) {
        console.error("Failed to notify teachers of drive access:", err);
      }
    }

    await logActivity(
      req.user!.userId,
      "DOCUMENT_ACCESS_UPDATE",
      `Updated access for item ID: ${fileId} to audience: ${audience}, class: ${targetClass || "ALL"}`
    );

    res.json(rule);
  } catch (err) {
    next(err);
  }
});

/**
 * Revoke/delete Access Rule for a file/folder
 */
router.delete("/:id/access", authenticate, adminOnly, async (req, res, next) => {
  try {
    const fileId = req.params.id as string;
    await prisma.driveAccessRule.deleteMany({
      where: { fileId },
    });

    await logActivity(
      req.user!.userId,
      "DOCUMENT_ACCESS_REVOKE",
      `Revoked access for item ID: ${fileId}`
    );

    res.json({ success: true, message: "Access rule removed successfully" });
  } catch (err) {
    next(err);
  }
});

/**
 * Share a presentation document and return its Google Slides embed URL.
 */
router.get("/:id/embed-url", authenticate, allRoles, async (req, res, next) => {
  try {
    const fileId = req.params.id as string;
    const allowed = await hasFolderAccess(fileId, req.user!);
    if (!allowed) {
      throw new AppError("Access denied", 403);
    }

    const drive = await getDriveClient();
    try {
      // Ensure the file is shared with "anyone with the link as reader" so Google Slides player can load it
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });
    } catch (err: any) {
      console.warn("Failed to share file on Drive:", err.message);
    }

    res.json({
      embedUrl: `https://docs.google.com/presentation/d/${fileId}/embed?start=false&loop=false`,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
