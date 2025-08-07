import { createSignal, onMount, For } from "solid-js";
import { generateExample, generateFeedback } from "../utils/api";

/**
 * RephraseTrainer.tsx (full‑screen UI)
 * ---------------------------------------------
 * SolidJS + daisyUI 練習アプリ
 *  - モード選択 (Paraphrase / Circumlocution / ELI5)
 *  - ランダムお題生成
 *  - Learner の入力
 *  - LLM 評価 (TODO: API 接続)
 *  - 設定モーダル (API Key / Model)
 */

interface Mode {
  value: "Paraphrase" | "Circumlocution" | "ELI5";
  label: string;
  hint: string;
}

const MODES: Mode[] = [
  { value: "Paraphrase", label: "Paraphrase", hint: "同じ意味を別の表現で" },
  { value: "Circumlocution", label: "Circumlocution", hint: "特徴や用途で説明" },
  { value: "ELI5", label: "ELI5", hint: "5歳児にわかる言葉で説明" },
];

// 例のお題リスト（あとで LLM 生成や外部 JSON）
const WORDS = [
  "cucumber",
  "gravity",
  "photosynthesis",
  "I'm tired",
  "blockchain",
  "inflation",
  "democracy",
  "quantum computer",
];

export default function RephraseTrainer() {
  // ------- global settings (localStorage) -------
  const [apiKey, setApiKey] = createSignal<string>(localStorage.getItem("OPENAI_KEY") ?? "");
  const [model, setModel] = createSignal<string>(
    localStorage.getItem("OPENAI_MODEL") || "local-llama"
  );

  const saveSettings = (k: string, m: string) => {
    localStorage.setItem("OPENAI_KEY", k);
    localStorage.setItem("OPENAI_MODEL", m);
    setApiKey(k);
    setModel(m);
  };

  // ------- practice state -------
  const [mode, setMode] = createSignal<Mode>(MODES[0]);
  const [topic, setTopic] = createSignal<string>("");
  const [answer, setAnswer] = createSignal<string>("");
  const [loading, setLoading] = createSignal<boolean>(false);
  const [modelAnswer, setModelAnswer] = createSignal<string>("");
  const [feedback, setFeedback] = createSignal<string>("");
  const [error, setError] = createSignal<string>("");

  // ------- conversation history -------
  const [conversations, setConversations] = createSignal<
    { user: string; assistant: string; feedback: string }[]
  >([]);
  const [currentStep, setCurrentStep] = createSignal<"input" | "evaluating" | "feedback">("input");

  // ------- helpers -------
  const pickRandomTopic = () => {
    const random = WORDS[Math.floor(Math.random() * WORDS.length)];
    setTopic(random);
    setAnswer("");
    setModelAnswer("");
    setFeedback("");
    setError("");
    setCurrentStep("input");
  };

  const evaluate = async () => {
    if (!answer().trim()) return;

    const currentApiKey = apiKey();
    const currentModel = model();

    if (!currentApiKey.trim()) {
      setError("APIキーが設定されていません。設定から入力してください。");
      return;
    }

    setLoading(true);
    setCurrentStep("evaluating");
    setError("");

    try {
      // Generate example answer
      const exampleAnswer = await generateExample(
        currentApiKey,
        currentModel,
        topic(),
        mode().value
      );

      // Generate feedback
      const feedbackText = await generateFeedback(
        currentApiKey,
        currentModel,
        topic(),
        mode().value,
        answer(),
        exampleAnswer
      );

      const newModelAnswer = `✨ 模範例:\n\n${exampleAnswer}`;
      const newFeedback = `💬 フィードバック:\n\n${feedbackText}`;

      setModelAnswer(newModelAnswer);
      setFeedback(newFeedback);

      // Add to conversation history
      setConversations((prev) => [
        ...prev,
        {
          user: answer(),
          assistant: newModelAnswer,
          feedback: newFeedback,
        },
      ]);

      setCurrentStep("feedback");
    } catch (err) {
      console.error("API Error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "APIエラーが発生しました。LM Studioが起動しているか確認してください。"
      );
    } finally {
      setLoading(false);
    }
  };

  onMount(pickRandomTopic);

  /* -------------------------------------------------
   * UI
   * -------------------------------------------------*/
  return (
    <div class="from-base-100 to-base-200 flex h-screen flex-col bg-gradient-to-br">
      {/* Navbar */}
      <div class="navbar from-primary to-secondary text-primary-content bg-gradient-to-r shadow-lg">
        <div class="flex-1">
          <span class="flex items-center gap-2 text-xl font-bold">🎨 言い換えトレーナー</span>
          <div class="ml-4 text-sm opacity-80">{mode().hint}</div>
        </div>
        <div class="flex-none gap-2">
          <div class="stats stats-horizontal bg-base-100/20 shadow">
            <div class="stat px-4 py-2">
              <div class="stat-title text-primary-content/70 text-xs">練習回数</div>
              <div class="stat-value text-primary-content text-sm">{conversations().length}</div>
            </div>
          </div>
          <button
            class="btn btn-sm btn-ghost text-primary-content hover:bg-base-100/20"
            onClick={() => {
              (document.getElementById("settings_modal") as HTMLDialogElement)!.showModal();
            }}
          >
            ⚙️ 設定
          </button>
        </div>
      </div>

      {/* Main split layout */}
      <div class="flex flex-1 overflow-hidden">
        {/* Left Panel - Practice Area */}
        <div class="flex flex-1 flex-col space-y-6 overflow-y-auto p-6">
          <div class="card bg-base-100 border-base-300 border shadow-xl">
            <div class="card-body">
              {/* Mode Selection */}
              <div class="mb-6 flex flex-wrap items-center gap-4">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-semibold">🎯 モード選択</span>
                  </label>
                  <select
                    class="select select-bordered select-primary w-full max-w-xs"
                    value={mode().value}
                    onChange={(e) => setMode(MODES.find((m) => m.value === e.currentTarget.value)!)}
                  >
                    <For each={MODES}>{(m) => <option value={m.value}>{m.label}</option>}</For>
                  </select>
                </div>
                <button class="btn btn-outline btn-accent" onClick={pickRandomTopic}>
                  🎲 新しいお題
                </button>
              </div>

              {/* Current Topic */}
              <div class="mb-6 text-center">
                <div class="text-base-content/70 mb-2 text-sm font-medium">現在のお題</div>
                <div
                  class={`badge badge-lg p-6 text-xl font-bold transition-all duration-500 ${
                    currentStep() === "input"
                      ? "badge-primary animate-pulse"
                      : currentStep() === "evaluating"
                        ? "badge-warning"
                        : "badge-success"
                  }`}
                >
                  {topic()}
                </div>
              </div>

              {/* Input Area */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">✍️ あなたの回答</span>
                  <span class="label-text-alt">{answer().length}/500</span>
                </label>
                <textarea
                  class={`textarea textarea-bordered h-40 transition-all duration-300 ${
                    currentStep() === "input"
                      ? "textarea-primary"
                      : currentStep() === "evaluating"
                        ? "textarea-warning"
                        : "textarea-success"
                  }`}
                  placeholder={`例: "${topic()}"を${mode().value === "Paraphrase" ? "言い換えると..." : mode().value === "Circumlocution" ? "説明すると..." : "5歳児に説明すると..."}`}
                  value={answer()}
                  maxLength={500}
                  disabled={loading()}
                  onInput={(e) => setAnswer(e.currentTarget.value)}
                />
              </div>

              {/* Error Display */}
              {error() && (
                <div class="alert alert-error">
                  <span>⚠️ {error()}</span>
                </div>
              )}

              {/* Action Button */}
              <div class="card-actions mt-6 justify-end">
                <button
                  class={`btn btn-lg transition-all duration-300 ${
                    loading()
                      ? "btn-warning loading"
                      : !answer().trim()
                        ? "btn-disabled"
                        : "btn-primary hover:scale-105"
                  }`}
                  disabled={loading() || !answer().trim()}
                  onClick={evaluate}
                >
                  {loading() ? (
                    <>
                      <span class="loading loading-spinner loading-sm" />
                      🤔 評価中...
                    </>
                  ) : (
                    <>📝 評価する</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Chat/Feedback Area */}
        <div class="bg-base-200 border-base-300 flex w-1/2 flex-col border-l">
          <div class="bg-base-300 border-base-300 border-b p-4">
            <h3 class="flex items-center gap-2 text-lg font-bold">💬 フィードバック & 履歴</h3>
          </div>

          <div class="flex-1 space-y-4 overflow-y-auto p-4">
            {conversations().length === 0 && !modelAnswer() ? (
              <div class="text-base-content/50 mt-20 text-center">
                <div class="mb-4 text-6xl">🌱</div>
                <p>お題に答えると、ここにフィードバックが表示されます</p>
              </div>
            ) : (
              <>
                {/* Previous conversations */}
                <For each={conversations()}>
                  {(conv, index) => (
                    <div class="chat-group opacity-60 transition-opacity duration-200 hover:opacity-100">
                      <div class="divider text-xs opacity-50">第{index() + 1}回</div>

                      <div class="chat chat-end">
                        <div class="chat-header">あなたの回答</div>
                        <div class="chat-bubble chat-bubble-primary">{conv.user}</div>
                      </div>

                      <div class="chat chat-start">
                        <div class="chat-header">AI の模範例</div>
                        <div class="chat-bubble chat-bubble-secondary text-sm whitespace-pre-wrap">
                          {conv.assistant}
                        </div>
                      </div>

                      <div class="chat chat-start">
                        <div class="chat-header">フィードバック</div>
                        <div class="chat-bubble chat-bubble-accent text-sm whitespace-pre-wrap">
                          {conv.feedback}
                        </div>
                      </div>
                    </div>
                  )}
                </For>

                {/* Current conversation */}
                {modelAnswer() && (
                  <div class="chat-group border-primary/30 bg-base-100/50 rounded-lg border-2 p-4">
                    <div class="divider divider-primary text-sm font-semibold">現在の結果</div>

                    <div class="chat chat-end">
                      <div class="chat-header font-semibold">あなたの回答</div>
                      <div class="chat-bubble chat-bubble-primary">{answer()}</div>
                    </div>

                    <div class="chat chat-start">
                      <div class="chat-header font-semibold">AI の模範例</div>
                      <div class="chat-bubble chat-bubble-secondary text-sm whitespace-pre-wrap">
                        {modelAnswer()}
                      </div>
                    </div>

                    <div class="chat chat-start">
                      <div class="chat-header font-semibold">フィードバック</div>
                      <div class="chat-bubble chat-bubble-accent text-sm whitespace-pre-wrap">
                        {feedback()}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Settings modal */}
      <dialog id="settings_modal" class="modal">
        <div class="modal-box max-w-md">
          <h3 class="mb-4 flex items-center gap-2 text-lg font-bold">⚙️ 設定</h3>

          <div class="space-y-4">
            <label class="form-control w-full">
              <div class="label">
                <span class="label-text font-semibold">🔑 API Key</span>
              </div>
              <input
                type="password"
                class="input input-bordered input-primary"
                placeholder="APIキーを入力..."
                value={apiKey()}
                onInput={(e) => setApiKey(e.currentTarget.value)}
              />
            </label>

            <label class="form-control w-full">
              <div class="label">
                <span class="label-text font-semibold">🤖 Model</span>
              </div>
              <input
                type="text"
                class="input input-bordered input-secondary"
                placeholder="local-llama"
                value={model()}
                onInput={(e) => setModel(e.currentTarget.value)}
              />
            </label>
          </div>

          <div class="modal-action">
            <form method="dialog">
              <button
                type="button"
                class="btn btn-primary mr-2"
                onClick={() => {
                  saveSettings(apiKey(), model());
                  (document.getElementById("settings_modal") as HTMLDialogElement)!.close();
                }}
              >
                ✅ 保存
              </button>
              <button class="btn btn-ghost">✖ 閉じる</button>
            </form>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
