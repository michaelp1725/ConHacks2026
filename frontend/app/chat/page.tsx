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
  const activeChatTitle =
    messages.find((message) => message.role === "user")?.content.slice(0, 56) ||
    "New refugee law research";

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
    <div className="research-chat-page">
      <header className="research-chat-header">
        <Link href="/" className="research-chat-brand" aria-label="Back to Case home">
          <img src="/assets/case-logo.png" alt="Case" />
        </Link>
        <div className="research-chat-title">
          <p>Refugee law workspace</p>
          <h1>Research chat</h1>
        </div>
        <div className="research-chat-header-actions">
          <span className="research-chat-status">
            {isLoading ? "Researching" : "Ready"}
          </span>
        </div>
      </header>

      <main className="research-chat-shell">
        <aside className="research-chat-sidebar" aria-label="Past chats">
          <div className="research-sidebar-head">
            <div>
              <p>Threads</p>
              <h2>Past chats</h2>
            </div>
            <button type="button" aria-label="Start new chat" disabled>
              +
            </button>
          </div>

          <div className="research-chat-list">
            <button type="button" className="research-chat-thread active">
              <span className="research-thread-title">{activeChatTitle}</span>
              <span className="research-thread-meta">
                {messages.length ? `${messages.length} messages` : "Draft"}
              </span>
            </button>
            <button type="button" className="research-chat-thread" disabled>
              <span className="research-thread-title">Religion based persecution</span>
              <span className="research-thread-meta">Coming soon</span>
            </button>
            <button type="button" className="research-chat-thread" disabled>
              <span className="research-thread-title">State protection analysis</span>
              <span className="research-thread-meta">Coming soon</span>
            </button>
            <button type="button" className="research-chat-thread" disabled>
              <span className="research-thread-title">Internal flight alternative</span>
              <span className="research-thread-meta">Coming soon</span>
            </button>
          </div>

          <div className="research-sidebar-note">
            <strong>History support</strong>
            <span>Current thread memory is active. Thread switching will plug into this list later.</span>
          </div>
        </aside>

        <section className="research-chat-main" aria-label="Research chat">
          <div className="research-chat-main-head">
            <div>
              <p>Ask in plain language</p>
              <h2>Canadian refugee law research</h2>
            </div>
            <div className="research-chat-chips" aria-label="Research modes">
              <span>Case law</span>
              <span>Legislation</span>
              <span>Evidence</span>
            </div>
          </div>

          <div className="research-chat-transcript">
            {messages.length === 0 ? (
              <div className="research-empty-state">
                <p>Start with a refugee law issue, claimant profile, or hearing question.</p>
                <div className="research-samples" aria-label="Sample prompts">
                  <button
                    type="button"
                    onClick={() =>
                      setInput("fear of persecution based on religion for a Christian convert from Iran")
                    }
                  >
                    Religious persecution
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setInput("how does the RPD assess state protection in refugee claims?")
                    }
                  >
                    State protection
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setInput("what evidence should support an internal flight alternative argument?")
                    }
                  >
                    IFA evidence
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
  );
}
