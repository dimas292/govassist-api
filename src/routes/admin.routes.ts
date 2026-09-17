import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { AdminDashboardController } from "../controllers/adminDashboard.controller";
import { requireAdminSession } from "../middleware/adminAuth";
import { adminLoginRateLimiter } from "../middleware/rateLimit";
import { avatarUpload, replyAttachmentUpload } from "../middleware/adminUpload";

const router = Router();
const controller = new AdminDashboardController();
const adminController = new AdminController();

router.post("/session", adminLoginRateLimiter, adminController.login);
router.get("/session", requireAdminSession, adminController.session);
router.delete("/session", requireAdminSession, adminController.logout);
router.patch("/profile", requireAdminSession, adminController.updateProfile);
router.patch("/profile/avatar", requireAdminSession, avatarUpload, adminController.updateAvatar);
router.get("/dashboard", requireAdminSession, controller.getDashboard);
router.get("/tickets", requireAdminSession, adminController.listTickets);
router.patch("/tickets/:trackingId/status", requireAdminSession, adminController.updateTicketStatus);
router.post("/tickets/:trackingId/replies", requireAdminSession, replyAttachmentUpload, adminController.createTicketReply);

export default router;
