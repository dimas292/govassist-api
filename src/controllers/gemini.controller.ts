import { Request, Response } from "express";
import { GeminiService } from "../services/gemini.service";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export class GeminiController {
  private geminiService: GeminiService;

  constructor() {
    this.geminiService = new GeminiService();
  }

  generateContent = asyncHandler(async (req: Request, res: Response) => {
    const { prompt, context, maxTokens, temperature } = req.body;

    const result = await this.geminiService.generateContent({
      prompt,
      context,
      maxTokens,
      temperature,
    });

    res
      .status(200)
      .json(ApiResponse.success(result, "Content generated successfully"));
  });

  chat = asyncHandler(async (req: Request, res: Response) => {
    const { message, history } = req.body;

    const result = await this.geminiService.chat({
      message,
      history,
    });

    res
      .status(200)
      .json(ApiResponse.success(result, "Chat response generated successfully"));
  });
}
