import { CorsOptions } from "cors";
import { config } from "../config";
import { ApiError } from "../utils/ApiError";

export const isOriginAllowed = (origin: string, allowedOrigins = config.corsAllowedOrigins) =>
  allowedOrigins.includes(origin);

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }
    callback(ApiError.forbidden("Origin tidak diizinkan"));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600,
};
