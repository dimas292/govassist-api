import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "http://localhost:3000",
  storageDir: path.resolve(process.env.STORAGE_DIR || "uploads"),
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
  },
} as const;
