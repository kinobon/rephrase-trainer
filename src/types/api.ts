export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export interface ChatCompletionRequest {
  model: string; // 例: local-llama-8B
  messages: ChatMessage[];
  temperature?: number;
}

export interface ChatCompletionResponse {
  choices: { message: ChatMessage }[];
}
