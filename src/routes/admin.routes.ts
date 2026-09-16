import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { AdminDashboardController } from "../controllers/adminDashboard.controller";
import { requireAdminSession } from "../middleware/adminAuth";

const router = Router();
const controller = new AdminDashboardController();
const adminController = new AdminController();

router.post("/session", adminController.login);
router.get("/session", requireAdminSession, adminController.session);
router.delete("/session", requireAdminSession, adminController.logout);
router.get("/dashboard", requireAdminSession, controller.getDashboard);
router.patch("/tickets/:trackingId/status", requireAdminSession, adminController.updateTicketStatus);

export default router;
