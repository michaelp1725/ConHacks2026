import { ChatMessage as ChatMessageType, Citation } from "@/types/chat";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { Children } from "react";

type ChatMessageProps = {
  message: ChatMessageType;
};

const ROUTE_LABELS: Record<string, string> = {
  CASE_SEARCH: "Case Law",
  LAW_SEARCH: "Legislation",
  BOTH: "Case Law + Legislation",
  OUT_OF_SCOPE: "Out of Scope",
};

const ROUTE_COLORS: Record<string, string> = {
  CASE_SEARCH: "route-case",
  LAW_SEARCH: "route-law",
  BOTH: "route-both",
  OUT_OF_SCOPE: "route-muted",
};

function renderTextWithCitationLinks(
  value: string,
  citationMap: Map<string, Citation>
) {
  const parts = value.split(/(\[(?:S\d+(?:,\s*)?)+\])/g);

  return parts.map((part, index) => {
    if (!/^\[(?:S\d+(?:,\s*)?)+\]$/.test(part)) {
      return part;
    }

    return part.split(/(S\d+)/g).map((citationPart, citationIndex) => {
      const citation = citationMap.get(citationPart);

      if (!citation?.url) {
        return citationPart;
      }

      return (
        <a
          key={`${citationPart}-${index}-${citationIndex}`}
          href={citation.url}
          target="_blank"
          rel="noopener noreferrer"
          className="research-inline-citation"
          title={citation.case_name}
        >
          {citationPart}
        </a>
      );
    });
  });
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const normalizedAssistantContent =
    !isUser && message.content.startsWith("**Something went wrong.**")
      ? message.content.replace("**Something went wrong.**", "Something went wrong.")
      : message.content;
  const citationMap = new Map(
    (message.citations || []).map((citation) => [citation.label, citation])
  );
  const markdownComponents: Components = {
    p({ children }) {
      return (
        <p>
          {Children.map(children, (child) =>
            typeof child === "string"
              ? renderTextWithCitationLinks(child, citationMap)
              : child
          )}
        </p>
      );
    },
  };

  return (
    <article className={`research-message-row ${isUser ? "user" : "assistant"}`}>
      <div
        className={`research-message-avatar ${isUser ? "user-avatar" : "assistant-avatar"}`}
        aria-hidden="true"
      >
        {isUser ? (
          "You"
        ) : (
          <img
            src="/favicon.ico"
            alt=""
            className="research-message-avatar-logo"
          />
        )}
      </div>
      <div className="research-message-bubble">
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <>
            {message.route && (
              <span
                className={`research-route-badge ${
                  ROUTE_COLORS[message.route] ?? "route-muted"
                }`}
              >
                {ROUTE_LABELS[message.route] ?? message.route}
              </span>
            )}

            <div className="research-markdown">
              <ReactMarkdown components={markdownComponents}>
                {normalizedAssistantContent}
              </ReactMarkdown>
            </div>

            {message.checklist && message.checklist.length > 0 && (
              <div className="research-answer-section">
                <p>Evidence Checklist</p>
                <ul>
                  {message.checklist.map((item, i) => (
                    <li key={i}>
                      <span aria-hidden="true">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {message.next_steps && message.next_steps.length > 0 && (
              <div className="research-answer-section">
                <p>Next Steps</p>
                <ol>
                  {message.next_steps.map((step, i) => (
                    <li key={i}>
                      <span>{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {message.citations && message.citations.length > 0 && (() => {
              const cases = message.citations.filter(c => c.source_type === "case");
              const laws = message.citations.filter(c => c.source_type === "law");
              const renderBadges = (items: typeof message.citations, className: string) =>
                items!.map((citation, index) => (
                  <a
                    key={`${message.id}-${citation.source_type}-${index}`}
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`research-source-pill ${className}`}
                    title={citation.case_name}
                  >
                    [{citation.label}] {citation.case_name}
                  </a>
                ));
              return (
                <div className="research-sources">
                  {cases.length > 0 && (
                    <div>
                      <p>References: Case Law</p>
                      <div>
                        {renderBadges(cases, "case-source")}
                      </div>
                    </div>
                  )}
                  {laws.length > 0 && (
                    <div>
                      <p>References: Legislation</p>
                      <div>
                        {renderBadges(laws, "law-source")}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {message.disclaimer && (
              <p className="research-disclaimer">{message.disclaimer}</p>
            )}
          </>
        )}
      </div>
    </article>
  );
}
