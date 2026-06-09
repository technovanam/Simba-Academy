import type { Request, RequestHandler } from "express";
import path from "node:path";
import { env } from "../config/env.js";
import {
  ensureUploadsDir,
  isAllowedUploadExtension,
  isAllowedUploadMime,
  UPLOADS_DIR,
} from "../config/uploads.js";
import { AppError } from "../utils/errors.js";
import { cjsImport } from "../utils/cjsImport.js";

type FileFilterCallback = (error: Error | null, acceptFile?: boolean) => void;

interface MulterModule {
  diskStorage: (options: {
    destination: (
      req: Request,
      file: Express.Multer.File,
      cb: (err: Error | null, dest: string) => void
    ) => void;
    filename: (
      req: Request,
      file: Express.Multer.File,
      cb: (err: Error | null, name: string) => void
    ) => void;
  }) => unknown;
  (options: {
    storage: unknown;
    fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => void;
    limits: { fileSize: number };
  }): {
    single: (field: string) => RequestHandler;
    array: (field: string, maxCount?: number) => RequestHandler;
  };
}

const multer = cjsImport<MulterModule>("multer");

ensureUploadsDir();

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) {
  if (!isAllowedUploadExtension(file.originalname)) {
    cb(
      new AppError(
        `File type not allowed. Use PDF, PPT, Word, image, or MP4 only.`,
        400
      )
    );
    return;
  }
  if (!isAllowedUploadMime(file.mimetype)) {
    cb(new AppError(`File type ${file.mimetype} is not allowed`, 400));
    return;
  }
  cb(null, true);
}

export const upload = multer({
  storage: diskStorage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE,
  },
});
