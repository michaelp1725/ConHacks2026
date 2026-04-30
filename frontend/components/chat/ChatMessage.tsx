import { ChatMessage as ChatMessageType } from "@/types/chat";
import ReactMarkdown from "react-markdown";

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

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <article className={`research-message-row ${isUser ? "user" : "assistant"}`}>
      <div className="research-message-avatar" aria-hidden="true">
        {isUser ? "You" : "C"}
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
              <ReactMarkdown>{message.content}</ReactMarkdown>
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
                      <p>Case Law</p>
                      <div>
                        {renderBadges(cases, "case-source")}
                      </div>
                    </div>
                  )}
                  {laws.length > 0 && (
                    <div>
                      <p>Legislation</p>
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
