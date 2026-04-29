"use client";

import { useRef, useState } from "react";

import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { streamChatQuery } from "@/lib/api";
import { ChatMessage as ChatMessageType } from "@/types/chat";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamMessageIdRef = useRef<string | null>(null);
  const pendingTokenBufferRef = useRef("");
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const flushPendingTokens = () => {
    const messageId = streamMessageIdRef.current;
    const pendingChunk = pendingTokenBufferRef.current;
    if (!messageId || !pendingChunk) {
      return;
    }

    pendingTokenBufferRef.current = "";
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId
          ? { ...message, content: `${message.content}${pendingChunk}` }
          : message,
      ),
    );
  };

  const clearStreamBuffering = () => {
    flushPendingTokens();
    if (flushIntervalRef.current) {
      clearInterval(flushIntervalRef.current);
      flushIntervalRef.current = null;
    }
    streamMessageIdRef.current = null;
    pendingTokenBufferRef.current = "";
  };

  const handleSubmit = async () => {
    if (!query.trim() || isLoading) {
      return;
    }

    const userMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      role: "user",
      content: query.trim(),
    };

    const outgoingQuery = query.trim();
    const assistantMessageId = crypto.randomUUID();
    streamMessageIdRef.current = assistantMessageId;
    pendingTokenBufferRef.current = "";
    if (flushIntervalRef.current) {
      clearInterval(flushIntervalRef.current);
    }
    flushIntervalRef.current = setInterval(flushPendingTokens, 40);
    setQuery("");
    setError(null);
    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        citations: [],
      },
    ]);
    setIsLoading(true);

    try {
      await streamChatQuery(outgoingQuery, {
        onToken: (token) => {
          pendingTokenBufferRef.current += token;
        },
        onCitations: (citations) => {
          flushPendingTokens();
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessageId ? { ...message, citations } : message,
            ),
          );
        },
      });
    } catch (submissionError) {
      const fallbackError =
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to reach the backend service.";
      setError(fallbackError);
      clearStreamBuffering();
      setMessages((prev) =>
        prev.filter((message) => message.id !== assistantMessageId),
      );
    } finally {
      clearStreamBuffering();
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-4xl px-4 py-4">
          <h1 className="text-xl font-semibold text-slate-900">
            Refugee Law AI Copilot
          </h1>
          <p className="text-sm text-slate-600">
            Canadian refugee case research assistant
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-4">
        <section className="flex-1 space-y-4 overflow-y-auto pb-28">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600">
              Ask a legal question to retrieve relevant Canadian refugee law
              cases and citations.
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}
        </section>

        <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-slate-100/95 px-4 py-3 backdrop-blur">
          <ChatInput
            value={query}
            onChange={setQuery}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  );
}
