import { NextFunction, Request, Response } from "express";
import { AdminAuthService } from "../services/adminAuth.service";
import { ApiError } from "../utils/ApiError";

export const ADMIN_SESSION_COOKIE = "govassist_admin_session";

const auth = new AdminAuthService();

const readCookie = (header: string | undefined, name: string) => {
  if (!header) return undefined;
  const entry = header.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : undefined;
};

export const requireAdminSession = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = readCookie(req.headers.cookie, ADMIN_SESSION_COOKIE);
    if (!token) throw ApiError.unauthorized("Silakan login sebagai admin");
    res.locals.adminActorId = auth.verify(token);
    next();
  } catch (error) {
    next(error);
  }
};
