"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { streamChatQuery } from "@/lib/api";
import type { ChatMessage as ChatMessageModel } from "@/types/chat";

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
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setIsLoading(true);

    let assistantContent = "";

    try {
      await streamChatQuery(query, {
        onToken: (token) => {
          assistantContent += token;
          setMessages((prev) => {
            const next = [...prev];
            const i = next.findIndex((m) => m.id === assistantId);
            if (i >= 0) {
              next[i] = { ...next[i], content: assistantContent };
            }
            return next;
          });
        },
        onCitations: (citations) => {
          setMessages((prev) => {
            const next = [...prev];
            const i = next.findIndex((m) => m.id === assistantId);
            if (i >= 0) {
              next[i] = { ...next[i], citations };
            }
            return next;
          });
        },
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
  }, [input, isLoading]);

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
              Ask a question about Canadian refugee law. Answers stream in as
              they are generated.
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
