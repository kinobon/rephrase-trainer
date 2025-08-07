import { createSignal, onMount, For } from "solid-js";

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

  // ------- helpers -------
  const pickRandomTopic = () => {
    const random = WORDS[Math.floor(Math.random() * WORDS.length)];
    setTopic(random);
    setAnswer("");
    setModelAnswer("");
    setFeedback("");
  };

  const evaluate = async () => {
    if (!answer().trim()) return;
    setLoading(true);
    // TODO: Replace with real LLM call using apiKey() & model()
    await new Promise((r) => setTimeout(r, 1000));
    setModelAnswer(`(模範解答例) ➜ ${topic()} を ${mode().value} すると…`);
    setFeedback("あなたの回答は良いですが、こうするとさらに伝わりやすくなります…");
    setLoading(false);
  };

  onMount(pickRandomTopic);

  /* -------------------------------------------------
   * UI
   * -------------------------------------------------*/
  return (
    <div class="flex h-screen flex-col">
      {/* Navbar */}
      <div class="navbar bg-neutral text-neutral-content px-4">
        <div class="flex-1">
          <span class="text-xl font-bold">言い換えトレーナー</span>
        </div>
        <div class="flex-none gap-2">
          <button
            class="btn btn-sm btn-ghost"
            onClick={() => {
              // open modal
              (document.getElementById("settings_modal") as HTMLDialogElement)!.showModal();
            }}
          >
            設定
          </button>
        </div>
      </div>

      {/* Main content */}
      <main class="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 overflow-y-auto p-6">
        {/* Mode Select */}
        <div class="flex items-center gap-4">
          <select
            class="select select-bordered"
            value={mode().value}
            onChange={(e) => setMode(MODES.find((m) => m.value === e.currentTarget.value)!)}
          >
            <For each={MODES}>{(m) => <option>{m.label}</option>}</For>
          </select>
          <button class="btn btn-outline btn-sm" onClick={pickRandomTopic}>
            別のお題
          </button>
          <span class="ml-auto hidden text-sm opacity-70 sm:inline">{mode().hint}</span>
        </div>

        {/* Topic Badge */}
        <div>
          <span class="badge badge-primary badge-lg p-4 text-lg">{topic()}</span>
        </div>

        {/* Answer textarea & Action */}
        <textarea
          class="textarea textarea-bordered h-32"
          placeholder="ここにあなたの言い換えを入力…"
          value={answer()}
          onInput={(e) => setAnswer(e.currentTarget.value)}
        />

        <button
          class="btn btn-primary w-32 self-end"
          disabled={loading() || !answer().trim()}
          onClick={evaluate}
        >
          {loading() ? <span class="loading loading-spinner loading-sm" /> : "評価する"}
        </button>

        {/* Results (chat bubbles) */}
        {modelAnswer() && (
          <div class="flex flex-col gap-4">
            <div class="chat chat-start">
              <div class="chat-bubble chat-bubble-secondary whitespace-pre-wrap">
                {modelAnswer()}
              </div>
            </div>
            <div class="chat chat-end">
              <div class="chat-bubble chat-bubble-primary whitespace-pre-wrap">{feedback()}</div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer class="footer footer-center bg-base-300 text-base-content p-4">
        <aside>
          <p class="text-xs opacity-70">© 2025 Rephrase Trainer</p>
        </aside>
      </footer>

      {/* Settings modal */}
      <dialog id="settings_modal" class="modal" closedby={undefined}>
        <form method="dialog" class="modal-box flex flex-col gap-4">
          <h3 class="text-lg font-bold">設定</h3>

          <label class="form-control w-full">
            <div class="label">
              <span class="label-text">API Key</span>
            </div>
            <input
              type="password"
              class="input input-bordered"
              value={apiKey()}
              onInput={(e) => setApiKey(e.currentTarget.value)}
            />
          </label>

          <label class="form-control w-full">
            <div class="label">
              <span class="label-text">Model</span>
            </div>
            <input
              type="text"
              class="input input-bordered"
              value={model()}
              onInput={(e) => setModel(e.currentTarget.value)}
            />
          </label>

          <div class="modal-action">
            <button type="button" class="btn" onClick={() => saveSettings(apiKey(), model())}>
              保存
            </button>
            <button class="btn">閉じる</button>
          </div>
        </form>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
