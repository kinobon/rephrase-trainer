import { createSignal, For } from "solid-js";
import { chat } from "../utils/api";
import type { ChatMessage } from "../types/api";

export default function ChatApp() {
  const [key, setKey] = createSignal(localStorage.getItem("OPENAI_KEY") ?? "");
  const [model, setModel] = createSignal("local-llama-8B");
  const [messages, setMessages] = createSignal<ChatMessage[]>([]);
  const [input, setInput] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  function saveKey(k: string) {
    localStorage.setItem("OPENAI_KEY", k);
    setKey(k);
  }

  async function send() {
    if (!input().trim()) return;
    const userMsg: ChatMessage = { role: "user", content: input() };
    setMessages([...messages(), userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const assistant = await chat(key(), {
        model: model(),
        messages: [...messages(), userMsg],
      });
      setMessages((m) => [...m, { role: "assistant", content: assistant }]);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div class="mx-auto flex max-w-xl flex-col gap-4 p-4">
      {/* --- Settings --- */}
      <details class="bg-base-200 rounded-box collapse">
        <summary class="collapse-title text-lg font-medium">Settings</summary>
        <div class="collapse-content flex flex-col gap-2">
          <input
            type="password"
            placeholder="OpenAI (LM Studio) API Key"
            class="input input-bordered w-full"
            value={key()}
            onInput={(e) => saveKey(e.currentTarget.value)}
          />
          <input
            type="text"
            placeholder="Model (e.g. local-llama-8B)"
            class="input input-bordered w-full"
            value={model()}
            onInput={(e) => setModel(e.currentTarget.value)}
          />
        </div>
      </details>

      {/* --- Chat messages --- */}
      <div class="rounded-box bg-base-200 flex h-96 flex-col gap-2 overflow-y-auto border p-3">
        <For each={messages()}>
          {(m) => (
            <div
              class={`chat ${m.role === "user" ? "chat-end" : "chat-start"} whitespace-pre-wrap`}
            >
              <div class="chat-bubble">{m.content}</div>
            </div>
          )}
        </For>
        {loading() && <span class="loading loading-dots loading-lg m-auto" />}
      </div>

      {/* --- Input --- */}
      <form
        class="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          class="textarea textarea-bordered flex-1 resize-none"
          rows={2}
          placeholder="Type a message…"
          value={input()}
          onInput={(e) => setInput(e.currentTarget.value)}
        />
        <button class="btn btn-primary" type="submit" disabled={loading()}>
          Send
        </button>
      </form>

      {error() && <div class="alert alert-error">{error()}</div>}
    </div>
  );
}
