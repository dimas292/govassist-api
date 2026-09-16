import { Request, Response } from "express";
import { config } from "../config";
import { ADMIN_SESSION_COOKIE } from "../middleware/adminAuth";
import { AdminAuthService } from "../services/adminAuth.service";
import { AdminTicketService } from "../services/adminTicket.service";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const auth = new AdminAuthService();
const tickets = new AdminTicketService();

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: config.nodeEnv === "production",
  maxAge: config.admin.sessionHours * 60 * 60 * 1000,
  path: "/api/admin",
};

export class AdminController {
  login = asyncHandler(async (req: Request, res: Response) => {
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!username || !password) throw ApiError.badRequest("Username dan password wajib diisi");

    const token = auth.login(username, password);
    const staff = await tickets.currentStaff(config.admin.actorId);
    res.cookie(ADMIN_SESSION_COOKIE, token, cookieOptions);
    res.json(ApiResponse.success(staff, "Login admin berhasil"));
  });

  session = asyncHandler(async (_req: Request, res: Response) => {
    const staff = await tickets.currentStaff(res.locals.adminActorId as number);
    res.json(ApiResponse.success(staff));
  });

  logout = asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie(ADMIN_SESSION_COOKIE, { ...cookieOptions, maxAge: undefined });
    res.json(ApiResponse.success(null, "Logout admin berhasil"));
  });

  updateTicketStatus = asyncHandler(async (req: Request, res: Response) => {
    const trackingId = Array.isArray(req.params.trackingId) ? req.params.trackingId[0] : req.params.trackingId;
    const ticket = await tickets.updateStatus(trackingId, req.body, res.locals.adminActorId as number);
    res.json(ApiResponse.success(ticket, "Status ticket berhasil diperbarui"));
  });
}
