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
async function hasFolderAccess(fileId: string | null, user: any): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  if (!fileId || fileId === "root") return true;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { studentClass: true },
    });
    const studentClass = dbUser?.studentClass;

    const ancestors = await getAncestors(fileId);
    // Ordered from the item itself, parent, grandparent, ..., up to root
    const idsToCheck = [fileId, ...[...ancestors].reverse().map((a) => a.id)];

    const rules = await prisma.driveAccessRule.findMany({
      where: { fileId: { in: idsToCheck } },
    });

    // Find the first rule in the hierarchy starting from the item up to root
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
        if (targetClass && (!studentClass || !targetClass.split(",").includes(studentClass))) return false;
      } else if (user.role === "STUDENT") {
        if (audience !== "BOTH" && audience !== "STUDENT") return false;
        if (targetClass && (!studentClass || !targetClass.split(",").includes(studentClass))) return false;
      }
      return true;
    }

    // By default, if no access rule is found in the path, deny access to students/teachers
    return false;
  } catch (err) {
    console.error("Error verifying folder access rules:", err);
    return false;
  }
}

/**
 * Filter items based on user role, class, and the stored DriveAccessRules.
 */
async function applyAccessControls(items: any[], user: any, folderId: string | null = null, isSearchOrRecent: boolean = false) {
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

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { studentClass: true },
  });
  const studentClass = dbUser?.studentClass;

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
          if (!targetClass || (studentClass && targetClass.split(",").includes(studentClass))) {
            result.push(item);
          }
        }
      } else if (user.role === "STUDENT") {
        if (audience === "BOTH" || audience === "STUDENT") {
          if (!targetClass || (studentClass && targetClass.split(",").includes(studentClass))) {
            result.push(item);
          }
        }
      }
    } else {
      // Inherit rule
      if (isSearchOrRecent) {
        // For search/recent, check access to the item's parent recursively
        const parentId = item.parents && item.parents.length > 0 ? item.parents[0] : null;
        const parentAllowed = await hasFolderAccess(parentId, user);
        if (parentAllowed) {
          item.accessRule = { audience: "BOTH", targetClass: null };
          result.push(item);
        }
      } else if (folderId && folderId !== "root") {
        // If browsing inside an allowed subfolder, inherit access from it
        item.accessRule = { audience: "BOTH", targetClass: null };
        result.push(item);
      }
      // If at root (folderId is null/root), default is deny, so item is not pushed.
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

    // Verify access to folder hierarchy
    const allowed = await hasFolderAccess(folderId, req.user!);
    if (!allowed) {
      throw new AppError("Access denied to this folder", 403);
    }

    const items = await listItems(folderId, search, type);
    const filteredItems = await applyAccessControls(items, req.user!, folderId, !!search);
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
    const recent = await getRecentDocuments();
    const filteredRecent = await applyAccessControls(recent, req.user!, null, true);
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
 * Manage Access Rule for a file/folder
 */
router.put("/:id/access", authenticate, adminOnly, async (req, res, next) => {
  try {
    const fileId = req.params.id as string;
    const { audience, targetClass } = req.body;

    const allowedAudiences = ["BOTH", "TEACHER", "STUDENT"];
    if (!allowedAudiences.includes(audience)) {
      throw new AppError("Invalid audience", 400);
    }

    const rule = await prisma.driveAccessRule.upsert({
      where: { fileId },
      update: {
        audience: audience as any,
        targetClass: targetClass || null,
      },
      create: {
        fileId,
        audience: audience as any,
        targetClass: targetClass || null,
      },
    });

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
