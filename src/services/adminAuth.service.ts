import { createHmac, timingSafeEqual } from "crypto";
import { config } from "../config";
import { ApiError } from "../utils/ApiError";

type SessionPayload = { actorId: number; expiresAt: number };

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

const signature = (payload: string) =>
  createHmac("sha256", config.admin.sessionSecret).update(payload).digest("base64url");

export class AdminAuthService {
  private assertConfigured() {
    if (
      !config.admin.username ||
      !config.admin.password ||
      !config.admin.sessionSecret ||
      !Number.isInteger(config.admin.actorId) ||
      config.admin.actorId < 1
    ) {
      throw ApiError.internal("Admin authentication is not configured");
    }
  }

  login(username: string, password: string) {
    this.assertConfigured();
    if (!safeEqual(username, config.admin.username) || !safeEqual(password, config.admin.password)) {
      throw ApiError.unauthorized("Username atau password admin salah");
    }

    const payload: SessionPayload = {
      actorId: config.admin.actorId,
      expiresAt: Date.now() + config.admin.sessionHours * 60 * 60 * 1000,
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${encoded}.${signature(encoded)}`;
  }

  verify(token: string) {
    this.assertConfigured();
    const [encoded, suppliedSignature] = token.split(".");
    if (!encoded || !suppliedSignature || !safeEqual(suppliedSignature, signature(encoded))) {
      throw ApiError.unauthorized("Sesi admin tidak valid");
    }

    try {
      const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
      if (payload.actorId !== config.admin.actorId || payload.expiresAt <= Date.now()) {
        throw ApiError.unauthorized("Sesi admin telah berakhir");
      }
      return payload.actorId;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.unauthorized("Sesi admin tidak valid");
    }
  }
}
