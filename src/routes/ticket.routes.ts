import { Router } from "express";
import { TicketController } from "../controllers/ticket.controller";
import { ticketUpload } from "../middleware/ticketUpload";
import { ticketCreateRateLimiter } from "../middleware/rateLimit";

const router = Router();
const controller = new TicketController();

router.get("/", controller.list);
router.get("/:trackingId", controller.detail);
router.post("/", ticketCreateRateLimiter, ticketUpload, controller.create);

export default router;
