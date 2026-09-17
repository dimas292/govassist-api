import dotenv from "dotenv";
import path from "path";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const storageDriver = process.env.STORAGE_DRIVER || "local";
if (storageDriver !== "local" && storageDriver !== "s3" && storageDriver !== "r2") {
  throw new Error("STORAGE_DRIVER must be local, s3, or r2");
}

const parseList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
const parseBoolean = (value: string | undefined, fallback = false) =>
  value === undefined ? fallback : value.toLowerCase() === "true";
const parseTrustProxy = (value: string | undefined): boolean | number | string => {
  if (!value || value.toLowerCase() === "false") return false;
  if (value.toLowerCase() === "true") return true;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
};
const defaultCorsOrigins = nodeEnv === "production"
  ? ""
  : "http://localhost:5173,http://127.0.0.1:5173";

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv,
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "http://localhost:3000",
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  shutdownTimeoutMs: parseInt(process.env.SHUTDOWN_TIMEOUT_MS || "10000", 10),
  corsAllowedOrigins: parseList(process.env.CORS_ALLOWED_ORIGINS || defaultCorsOrigins),
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || "200", 10),
    ticketCreateMax: parseInt(process.env.TICKET_CREATE_RATE_LIMIT_MAX || "10", 10),
    adminLoginMax: parseInt(process.env.ADMIN_LOGIN_RATE_LIMIT_MAX || "10", 10),
  },
  storage: {
    driver: storageDriver,
    localDir: path.resolve(process.env.STORAGE_DIR || "uploads"),
    s3: {
      bucket: process.env.S3_BUCKET || "",
      region: process.env.S3_REGION || "",
      endpoint: process.env.S3_ENDPOINT || undefined,
      accessKeyId: process.env.S3_ACCESS_KEY_ID || undefined,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || undefined,
      forcePathStyle: parseBoolean(process.env.S3_FORCE_PATH_STYLE),
    },
    r2: {
      accountId: process.env.R2_ACCOUNT_ID || "",
      bucket: process.env.R2_BUCKET || "",
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
  },
  uploads: {
    audioMaxBytes: parseInt(process.env.AUDIO_MAX_BYTES || "20971520", 10),
    imageMaxBytes: parseInt(process.env.IMAGE_MAX_BYTES || "5242880", 10),
    maxImages: 3,
  },

  admin: {
    username: process.env.ADMIN_USERNAME || "",
    password: process.env.ADMIN_PASSWORD || "",
    sessionSecret: process.env.ADMIN_SESSION_SECRET || "",
    actorId: parseInt(process.env.ADMIN_ACTOR_ID || "0", 10),
    sessionHours: parseInt(process.env.ADMIN_SESSION_HOURS || "8", 10),
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || "2048", 10),
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || "0.7"),
    timeoutMs: parseInt(process.env.GEMINI_TIMEOUT_MS || "30000", 10),
    replyStatusTimeoutMs: parseInt(process.env.GEMINI_REPLY_STATUS_TIMEOUT_MS || "8000", 10),
  },
} as const;
