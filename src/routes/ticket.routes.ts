import { Router } from "express";
import { TicketController } from "../controllers/ticket.controller";
import { ticketUpload } from "../middleware/ticketUpload";

const router = Router();
const controller = new TicketController();

router.get("/", controller.list);
router.get("/:trackingId", controller.detail);
router.post("/", ticketUpload, controller.create);

export default router;
