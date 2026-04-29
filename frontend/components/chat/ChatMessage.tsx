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
  CASE_SEARCH: "bg-blue-50 text-blue-700 border-blue-200",
  LAW_SEARCH: "bg-purple-50 text-purple-700 border-purple-200",
  BOTH: "bg-teal-50 text-teal-700 border-teal-200",
  OUT_OF_SCOPE: "bg-slate-50 text-slate-500 border-slate-200",
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
          <>
            {message.route && (
              <span
                className={`mb-3 inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  ROUTE_COLORS[message.route] ?? "bg-slate-50 text-slate-500 border-slate-200"
                }`}
              >
                {ROUTE_LABELS[message.route] ?? message.route}
              </span>
            )}

            <div className="prose prose-sm max-w-none whitespace-pre-wrap leading-7 prose-a:text-blue-700 hover:prose-a:text-blue-800">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>

            {message.checklist && message.checklist.length > 0 && (
              <div className="mt-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Evidence Checklist
                </p>
                <ul className="space-y-1">
                  {message.checklist.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-0.5 text-blue-500">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {message.next_steps && message.next_steps.length > 0 && (
              <div className="mt-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Next Steps
                </p>
                <ol className="space-y-1 list-none">
                  {message.next_steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="min-w-[1.25rem] font-semibold text-blue-600">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {message.citations && message.citations.length > 0 && (
              <div className="mt-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Sources
                </p>
                <div className="flex flex-wrap gap-2">
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
              </div>
            )}

            {message.disclaimer && (
              <p className="mt-4 text-xs italic text-slate-400">{message.disclaimer}</p>
            )}
          </>
        )}
      </div>
    </article>
  );
}
