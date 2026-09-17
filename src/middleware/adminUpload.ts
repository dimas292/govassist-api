import { RequestHandler } from "express";
import multer from "multer";
import { config } from "../config";
import { ApiError } from "../utils/ApiError";
import { hasValidSignature } from "./ticketUpload";

const imageTypes = new Set(["image/jpeg", "image/png"]);

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: config.uploads.maxImages,
    fileSize: config.uploads.imageMaxBytes,
  },
  fileFilter: (_req, file, callback) => {
    if (imageTypes.has(file.mimetype)) {
      callback(null, true);
      return;
    }
    callback(ApiError.badRequest("Only JPEG and PNG images are supported"));
  },
});

const validateImages = (next: Parameters<RequestHandler>[2], files: Express.Multer.File[]) => {
  if (files.some((file) => file.size > config.uploads.imageMaxBytes)) {
    next(ApiError.badRequest("An image exceeds the configured size limit"));
    return false;
  }
  if (!files.every(hasValidSignature)) {
    next(ApiError.badRequest("File content does not match its declared media type"));
    return false;
  }
  return true;
};

const runUpload = (
  middleware: RequestHandler,
  filesFromRequest: (req: Parameters<RequestHandler>[0]) => Express.Multer.File[],
): RequestHandler => (req, res, next) => {
  middleware(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      next(ApiError.badRequest(error.message));
      return;
    }
    if (error) {
      next(error);
      return;
    }
    if (validateImages(next, filesFromRequest(req))) next();
  });
};

export const replyAttachmentUpload = runUpload(
  imageUpload.array("attachments", config.uploads.maxImages),
  (req) => (req.files as Express.Multer.File[] | undefined) || [],
);

export const avatarUpload = runUpload(
  imageUpload.single("avatar"),
  (req) => req.file ? [req.file] : [],
);
