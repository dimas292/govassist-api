import { RequestHandler } from "express";
import multer from "multer";
import { config } from "../config";
import { ApiError } from "../utils/ApiError";

const audioTypes = new Set(["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg"]);
const imageTypes = new Set(["image/jpeg", "image/png"]);

export const hasValidSignature = (file: Pick<Express.Multer.File, "buffer" | "mimetype">) => {
  const bytes = file.buffer;
  switch (file.mimetype) {
    case "audio/webm":
      return bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    case "audio/ogg":
      return bytes.subarray(0, 4).toString("ascii") === "OggS";
    case "audio/mp4":
      return bytes.subarray(4, 8).toString("ascii") === "ftyp";
    case "audio/mpeg":
      return bytes.subarray(0, 3).toString("ascii") === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    default:
      return false;
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: config.uploads.maxImages + 1,
    fileSize: Math.max(config.uploads.audioMaxBytes, config.uploads.imageMaxBytes),
  },
  fileFilter: (_req, file, callback) => {
    const valid =
      (file.fieldname === "audio" && audioTypes.has(file.mimetype)) ||
      (file.fieldname === "attachments" && imageTypes.has(file.mimetype));
    if (valid) {
      callback(null, true);
    } else {
      callback(ApiError.badRequest(`Unsupported file type for ${file.fieldname}`));
    }
  },
});

const fields = upload.fields([
  { name: "audio", maxCount: 1 },
  { name: "attachments", maxCount: config.uploads.maxImages },
]);

export const ticketUpload: RequestHandler = (req, res, next) => {
  fields(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      next(ApiError.badRequest(error.message));
      return;
    }
    if (error) {
      next(error);
      return;
    }

    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const audio = files?.audio?.[0];
    const attachments = files?.attachments || [];

    if (!audio) {
      next(ApiError.badRequest("Audio recording is required"));
      return;
    }
    if (audio.size > config.uploads.audioMaxBytes) {
      next(ApiError.badRequest("Audio recording exceeds the configured size limit"));
      return;
    }
    if (attachments.some((file) => file.size > config.uploads.imageMaxBytes)) {
      next(ApiError.badRequest("An image exceeds the configured size limit"));
      return;
    }
    if (![audio, ...attachments].every(hasValidSignature)) {
      next(ApiError.badRequest("File content does not match its declared media type"));
      return;
    }
    next();
  });
};
