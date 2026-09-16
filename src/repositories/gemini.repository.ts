import { geminiModel } from "../config/gemini";
import {
  ConversationMessage,
  PromptRequest,
  PromptResponse,
  ChatRequest,
  ChatResponse,
} from "../models/prompt.model";
import { config } from "../config";

export class GeminiRepository {
  async generateContent(data: PromptRequest): Promise<PromptResponse> {
    const prompt = data.context
      ? `Context: ${data.context}\n\nUser: ${data.prompt}`
      : data.prompt;

    const result = await geminiModel.generateContent(prompt);
    const response = result.response;

    return {
      response: response.text(),
      model: config.gemini.model,
    };
  }

  async chat(data: ChatRequest): Promise<ChatResponse> {
    const history: ConversationMessage[] = data.history || [];

    const chat = geminiModel.startChat({
      history: history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.parts }],
      })),
    });

    const result = await chat.sendMessage(data.message);
    const response = result.response.text();

    const updatedHistory: ConversationMessage[] = [
      ...history,
      { role: "user", parts: data.message },
      { role: "model", parts: response },
    ];

    return {
      response,
      history: updatedHistory,
    };
  }
}
