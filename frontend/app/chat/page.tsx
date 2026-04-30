"use client";

import Link from "next/link";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { sendChatQuery, type HistoryMessage } from "@/lib/api";
import type { ChatMessage as ChatMessageModel } from "@/types/chat";

const THREAD_STORAGE_KEY = "case.researchChatThreads";

type ChatThread = {
  id: string;
  title: string;
  messages: ChatMessageModel[];
  updatedAt: string;
};

function createThread(): ChatThread {
  return {
    id: crypto.randomUUID(),
    title: "New legal chat",
    messages: [],
    updatedAt: new Date().toISOString(),
  };
}

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

function formatThreadTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function loadThreads(): ChatThread[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(THREAD_STORAGE_KEY) || "[]") as ChatThread[];
    return Array.isArray(parsed) ? parsed.filter((thread) => thread.id) : [];
  } catch {
    return [];
  }
}

function saveThreads(threads: ChatThread[]) {
  localStorage.setItem(THREAD_STORAGE_KEY, JSON.stringify(threads.slice(0, 25)));
}

export default function ChatPage() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [isThreadSwitching, setIsThreadSwitching] = useState(false);
  const previousActiveThreadId = useRef<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedThreads = loadThreads();
    const initialThreads = savedThreads.length ? savedThreads : [createThread()];
    initialThreads.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    startTransition(() => {
      setThreads(initialThreads);
      setActiveThreadId(initialThreads[0]?.id ?? null);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) {
      saveThreads(threads);
    }
  }, [hydrated, threads]);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? threads[0],
    [activeThreadId, threads]
  );
  const messages = useMemo(() => activeThread?.messages ?? [], [activeThread]);

  useEffect(() => {
    if (!hydrated || !activeThreadId) {
      previousActiveThreadId.current = activeThreadId;
      return;
    }

    const isInitialMount = previousActiveThreadId.current === null;
    const didThreadChange = previousActiveThreadId.current !== activeThreadId;
    previousActiveThreadId.current = activeThreadId;

    if (isInitialMount || !didThreadChange) return;

    setIsThreadSwitching(true);
    const timeoutId = window.setTimeout(() => setIsThreadSwitching(false), 260);
    return () => window.clearTimeout(timeoutId);
  }, [activeThreadId, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const transcriptEl = transcriptRef.current;
    if (!transcriptEl) return;

    const rafId = window.requestAnimationFrame(() => {
      const lastMessageRow = transcriptEl.querySelector(
        ".research-message-row:last-child"
      ) as HTMLElement | null;

      if (!lastMessageRow) {
        transcriptEl.scrollTo({ top: transcriptEl.scrollHeight, behavior: "smooth" });
        return;
      }

      const rowTop = lastMessageRow.offsetTop;
      const rowHeight = lastMessageRow.offsetHeight;
      const viewportHeight = transcriptEl.clientHeight;

      // If the latest message is very tall, anchor to its start so users can read from the top.
      if (rowHeight > viewportHeight * 0.72) {
        transcriptEl.scrollTo({
          top: Math.max(rowTop - 12, 0),
          behavior: "smooth",
        });
        return;
      }

      transcriptEl.scrollTo({
        top: transcriptEl.scrollHeight,
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [activeThreadId, hydrated, messages]);

  const onNewThread = () => {
    if (isLoading) return;
    const thread = createThread();
    setThreads((prev) => [thread, ...prev]);
    setActiveThreadId(thread.id);
    setInput("");
  };

  const onSelectThread = (threadId: string) => {
    if (isLoading) return;
    setActiveThreadId(threadId);
    setInput("");
  };

  const onDeleteThread = (threadId: string) => {
    if (isLoading) return;

    setThreads((prev) => {
      const next = prev.filter((thread) => thread.id !== threadId);

      if (!next.length) {
        const replacement = createThread();
        setActiveThreadId(replacement.id);
        setInput("");
        return [replacement];
      }

      if (threadId === activeThreadId) {
        setActiveThreadId(next[0].id);
        setInput("");
      }

      return next;
    });
  };

  const handleSubmit = useCallback(async () => {
    const query = input.trim();
    if (!query || isLoading || !activeThread) return;

    setInput("");
    const userMsg: ChatMessageModel = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
    };
    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessageModel = {
      id: assistantId,
      role: "assistant",
      content: "",
    };
    const history = buildHistory(messages);
    const submittedThreadId = activeThread.id;
    const now = new Date().toISOString();
    const title =
      activeThread.messages.length === 0
        ? query.slice(0, 64) + (query.length > 64 ? "..." : "")
        : activeThread.title;

    setThreads((prev) => {
      const next = prev.map((thread) =>
        thread.id === submittedThreadId
          ? {
              ...thread,
              title,
              updatedAt: now,
              messages: [
                ...thread.messages,
                userMsg,
                assistantMsg,
              ],
            }
          : thread
      );
      next.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      return next;
    });
    setIsLoading(true);

    try {
      const result = await sendChatQuery(query, history);
      setThreads((prev) => {
        const next = prev.map((thread) => {
          if (thread.id !== submittedThreadId) return thread;
          return {
            ...thread,
            updatedAt: new Date().toISOString(),
            messages: thread.messages.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    content: result.explanation,
                    checklist: result.checklist,
                    next_steps: result.next_steps,
                    disclaimer: result.disclaimer,
                    citations: result.citations,
                    route: result.route,
                  }
                : message
            ),
          };
        });
        next.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        return next;
      });
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "Request failed";
      const message = /[.!?]$/.test(rawMessage) ? rawMessage : `${rawMessage}.`;
      setThreads((prev) => {
        const next = prev.map((thread) => {
          if (thread.id !== submittedThreadId) return thread;
          return {
            ...thread,
            updatedAt: new Date().toISOString(),
            messages: thread.messages.map((chatMessage) =>
              chatMessage.id === assistantId
                ? {
                    ...chatMessage,
                    content: `Something went wrong. ${message}`,
                  }
                : chatMessage
            ),
          };
        });
        next.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeThread, input, isLoading, messages]);

  if (!hydrated || !activeThread) {
    return null;
  }

  return (
    <div className="research-chat-page">
      <div className="page research-chat-page-shell">
        <main className="research-chat-shell">
          <aside className="research-chat-sidebar" aria-label="Past chats">
          <div className="research-sidebar-head">
            <div>
              <p>Threads</p>
              <h2>Past chats</h2>
            </div>
            <button
              type="button"
              aria-label="Start new chat"
              onClick={onNewThread}
              disabled={isLoading}
            >
              +
            </button>
          </div>

          <div className="research-chat-list">
            {threads.map((thread) => (
              <div
                key={thread.id}
                className={`research-chat-thread-row ${
                  thread.id === activeThread.id ? "active" : ""
                }`.trim()}
              >
                <button
                  type="button"
                  className="research-chat-thread"
                  onClick={() => onSelectThread(thread.id)}
                  disabled={isLoading && thread.id !== activeThread.id}
                >
                  <span className="research-thread-title">{thread.title}</span>
                  <span className="research-thread-meta">
                    {thread.messages.length
                      ? `${thread.messages.length} messages - ${formatThreadTime(thread.updatedAt)}`
                      : "Draft"}
                  </span>
                </button>
                <button
                  type="button"
                  className="research-delete-thread"
                  aria-label={`Delete chat: ${thread.title}`}
                  title="Delete chat"
                  onClick={() => onDeleteThread(thread.id)}
                  disabled={isLoading}
                >
                  x
                </button>
              </div>
            ))}
          </div>
          </aside>

          <section
            className={`research-chat-main ${isThreadSwitching ? "is-switching" : ""}`.trim()}
            aria-label="Research chat"
          >
            <div className="research-chat-main-head">
              <div>
                <Link href="/" className="research-chat-inline-brand" aria-label="Back to Case home">
                  <img src="/assets/case-logo.png" alt="Case" />
                </Link>
              </div>
              <Link href="/#landing-about" className="research-chat-disclaimer-link">
                MEN Corp. Ltd. is NOT liable for any civil actions.
              </Link>
            </div>

            <div ref={transcriptRef} className="research-chat-transcript">
              {messages.length === 0 ? (
                <div className="research-empty-state">
                  <p>Start with a refugee law issue, claimant profile, or hearing question.</p>
                  <p className="research-samples-label">Try one of our sample prompts:</p>
                  <div className="research-samples" aria-label="Sample prompts">
                    <button
                      type="button"
                      onClick={() =>
                        setInput("fear of persecution based on religion for a Christian convert from Iran")
                      }
                    >
                      Religious persecution claim
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setInput("how does the RPD assess state protection in refugee claims?")
                      }
                    >
                      State protection assessment
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setInput("what evidence should support an internal flight alternative argument?")
                      }
                    >
                      Internal flight evidence
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))
              )}
            </div>

            <div className="research-chat-composer">
              <ChatInput
                value={input}
                isLoading={isLoading}
                onChange={setInput}
                onSubmit={handleSubmit}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
