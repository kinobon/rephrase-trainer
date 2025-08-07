import type { ChatCompletionRequest, ChatCompletionResponse } from "../types/api";

const ENDPOINT = "http://localhost:1234/v1/chat/completions"; // LM Studio のデフォルト

export async function chat(key: string, body: ChatCompletionRequest): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as ChatCompletionResponse;
  return data.choices[0].message.content;
}
