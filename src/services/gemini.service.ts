import { GeminiRepository } from "../repositories/gemini.repository";
import { ApiError } from "../utils/ApiError";
import {
  PromptRequest,
  PromptResponse,
  ChatRequest,
  ChatResponse,
} from "../models/prompt.model";

export class GeminiService {
  private geminiRepository: GeminiRepository;

  constructor() {
    this.geminiRepository = new GeminiRepository();
  }

  async generateContent(data: PromptRequest): Promise<PromptResponse> {
    if (!data.prompt || data.prompt.trim().length === 0) {
      throw ApiError.badRequest("Prompt is required");
    }

    try {
      const result = await this.geminiRepository.generateContent(data);

      return result;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to generate content";
      throw ApiError.internal(message);
    }
  }

  async chat(data: ChatRequest): Promise<ChatResponse> {
    if (!data.message || data.message.trim().length === 0) {
      throw ApiError.badRequest("Message is required");
    }

    try {
      return await this.geminiRepository.chat(data);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to process chat";
      throw ApiError.internal(message);
    }
  }
}
