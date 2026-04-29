import { ChatMessage as ChatMessageType } from "@/types/chat";
import ReactMarkdown from "react-markdown";

type ChatMessageProps = {
  message: ChatMessageType;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <article className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-3xl rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? "bg-blue-700 text-white"
            : "border border-slate-200 bg-white text-slate-800"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-7">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none whitespace-pre-wrap leading-7 prose-a:text-blue-700 hover:prose-a:text-blue-800">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.citations.map((citation, index) => (
              <a
                key={`${message.id}-citation-${index}`}
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-900 transition hover:bg-blue-100"
                title={citation.case_name}
              >
                {citation.case_name} ({citation.relevance_score.toFixed(2)})
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
