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

// Generate example answer for a given topic and mode
export async function generateExample(
  key: string,
  model: string,
  topic: string,
  mode: "Paraphrase" | "Circumlocution" | "ELI5"
): Promise<string> {
  const prompts = {
    Paraphrase: `「${topic}」を別の表現で言い換えてください。同じ意味を保ちながら、異なる言葉や表現を使って表現してください。`,
    Circumlocution: `「${topic}」という言葉を使わずに、その特徴や用途、性質を説明してください。相手がその言葉を推測できるような説明をしてください。`,
    ELI5: `「${topic}」を5歳の子供にも分かるような簡単で親しみやすい言葉で説明してください。難しい言葉は使わずに説明してください。`,
  };

  const response = await chat(key, {
    model,
    messages: [
      {
        role: "system",
        content:
          "あなたは言語学習を支援するAIアシスタントです。ユーザーの要求に応じて、適切な言い換えや説明を提供してください。回答は簡潔で分かりやすくしてください。",
      },
      {
        role: "user",
        content: prompts[mode],
      },
    ],
    temperature: 0.7,
  });

  return response;
}

// Generate feedback for user's answer
export async function generateFeedback(
  key: string,
  model: string,
  topic: string,
  mode: "Paraphrase" | "Circumlocution" | "ELI5",
  userAnswer: string,
  exampleAnswer: string
): Promise<string> {
  const modeDescriptions = {
    Paraphrase: "言い換え（同じ意味を別の表現で）",
    Circumlocution: "迂言法（特徴や用途で説明）",
    ELI5: "5歳児向け説明（簡単で分かりやすく）",
  };

  const response = await chat(key, {
    model,
    messages: [
      {
        role: "system",
        content: `あなたは言語学習を支援する優しいAIコーチです。学習者の回答を評価し、建設的なフィードバックを提供してください。

フィードバックの構成：
1. 良い点を具体的に褒める（✅で始める）
2. 改善できる点を提案する（🔧で始める）
3. 励ましの言葉を添える

トーンは親しみやすく、前向きで、学習意欲を高めるものにしてください。`,
      },
      {
        role: "user",
        content: `お題: 「${topic}」
モード: ${modeDescriptions[mode]}

学習者の回答: 「${userAnswer}」
模範例: 「${exampleAnswer}」

上記の学習者の回答について、建設的なフィードバックをお願いします。`,
      },
    ],
    temperature: 0.8,
  });

  return response;
}
