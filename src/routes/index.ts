import { Router } from "express";
import geminiRoutes from "./gemini.routes";
import ticketRoutes from "./ticket.routes";
import adminRoutes from "./admin.routes";

const router = Router();

router.use("/gemini", geminiRoutes);
router.use("/tickets", ticketRoutes);
router.use("/admin", adminRoutes);

export default router;
