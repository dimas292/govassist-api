import { Router } from "express";
import { MediaController } from "../controllers/media.controller";

const router = Router();
const controller = new MediaController();

router.get("/:folder/:fileName", controller.read);

export default router;
