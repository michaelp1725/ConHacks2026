"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { sendChatQuery, type HistoryMessage } from "@/lib/api";
import type { ChatMessage as ChatMessageModel } from "@/types/chat";

function formatAssistantForHistory(message: ChatMessageModel) {
  const sections = [message.content];

  if (message.checklist?.length) {
    sections.push(`Evidence Checklist:\n${message.checklist.map((item) => `- ${item}`).join("\n")}`);
  }

  if (message.next_steps?.length) {
    sections.push(`Next Steps:\n${message.next_steps.map((item, i) => `${i + 1}. ${item}`).join("\n")}`);
  }

  if (message.disclaimer) {
    sections.push(`Disclaimer: ${message.disclaimer}`);
  }

  return sections.filter(Boolean).join("\n\n");
}

function buildHistory(messages: ChatMessageModel[]): HistoryMessage[] {
  return messages
    .filter((message) => message.content.trim())
    .slice(-8)
    .map((message) => ({
      role: message.role,
      content:
        message.role === "assistant"
          ? formatAssistantForHistory(message)
          : message.content,
    }));
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessageModel[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    const query = input.trim();
    if (!query || isLoading) return;

    setInput("");
    const userMsg: ChatMessageModel = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
    };
    const assistantId = crypto.randomUUID();
    const history = buildHistory(messages);

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setIsLoading(true);

    try {
      const result = await sendChatQuery(query, history);
      setMessages((prev) => {
        const next = [...prev];
        const i = next.findIndex((m) => m.id === assistantId);
        if (i >= 0) {
          next[i] = {
            ...next[i],
            content: result.explanation,
            checklist: result.checklist,
            next_steps: result.next_steps,
            disclaimer: result.disclaimer,
            citations: result.citations,
            route: result.route,
          };
        }
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      setMessages((prev) => {
        const next = [...prev];
        const i = next.findIndex((m) => m.id === assistantId);
        if (i >= 0) {
          next[i] = {
            ...next[i],
            content: `**Something went wrong.** ${message}`,
          };
        }
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col bg-slate-50">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <Link
          href="/"
          className="text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          Back to home
        </Link>
        <h1 className="text-center text-sm font-semibold text-slate-800 sm:text-base">
          Refugee law research chat
        </h1>
        <span className="w-24 sm:w-32" aria-hidden="true" />
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 overflow-hidden px-4 py-6">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-slate-500">
              Ask a question about Canadian refugee law.
            </p>
          ) : (
            messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}
        </div>

        <ChatInput
          value={input}
          isLoading={isLoading}
          onChange={setInput}
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  );
}
