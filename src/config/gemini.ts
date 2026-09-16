import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "./index";

if (!config.gemini.apiKey) {
  console.warn("GEMINI_API_KEY is not set. Gemini features will not work.");
}

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

export const geminiModel = genAI.getGenerativeModel({
  model: config.gemini.model,
  generationConfig: {
    maxOutputTokens: config.gemini.maxTokens,
    temperature: config.gemini.temperature,
  },
});

export { genAI };
