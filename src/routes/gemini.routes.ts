import { Router } from "express";
import { body } from "express-validator";
import { GeminiController } from "../controllers/gemini.controller";
import { validate } from "../middleware/validate";

const router = Router();
const geminiController = new GeminiController();

router.post(
  "/generate",
  [
    body("prompt")
      .trim()
      .notEmpty()
      .withMessage("Prompt is required")
      .isLength({ min: 1, max: 10000 })
      .withMessage("Prompt must be between 1 and 10000 characters"),
    body("context")
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage("Context must not exceed 5000 characters"),
  ],
  validate,
  geminiController.generateContent
);

router.post(
  "/chat",
  [
    body("message")
      .trim()
      .notEmpty()
      .withMessage("Message is required")
      .isLength({ min: 1, max: 10000 })
      .withMessage("Message must be between 1 and 10000 characters"),
    body("history")
      .optional()
      .isArray()
      .withMessage("History must be an array"),
    body("history.*.role")
      .optional()
      .isIn(["user", "model"])
      .withMessage("Role must be 'user' or 'model'"),
    body("history.*.parts")
      .optional()
      .isString()
      .withMessage("Parts must be a string"),
  ],
  validate,
  geminiController.chat
);

export default router;
