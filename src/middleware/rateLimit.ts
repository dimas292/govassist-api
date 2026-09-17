import { rateLimit } from "express-rate-limit";
import { config } from "../config";
import { ApiResponse } from "../utils/ApiResponse";

const limiter = (max: number, message: string) => rateLimit({
  windowMs: config.rateLimit.windowMs,
  limit: max,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json(ApiResponse.error(message, 429)),
});

export const apiRateLimiter = limiter(
  config.rateLimit.max,
  "Terlalu banyak permintaan. Coba lagi nanti.",
);

export const ticketCreateRateLimiter = limiter(
  config.rateLimit.ticketCreateMax,
  "Terlalu banyak laporan dibuat. Coba lagi nanti.",
);

export const adminLoginRateLimiter = limiter(
  config.rateLimit.adminLoginMax,
  "Terlalu banyak percobaan login. Coba lagi nanti.",
);
