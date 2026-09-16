export interface PromptRequest {
  prompt: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface PromptResponse {
  response: string;
  model: string;
  tokensUsed?: number;
}

export interface ConversationMessage {
  role: "user" | "model";
  parts: string;
}

export interface ChatRequest {
  message: string;
  history?: ConversationMessage[];
}

export interface ChatResponse {
  response: string;
  history: ConversationMessage[];
}
