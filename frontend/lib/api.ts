import { ChatApiResponse } from "@/types/chat";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function sendChatQuery(query: string): Promise<ChatApiResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Backend request failed with status ${response.status}`);
  }

  return (await response.json()) as ChatApiResponse;
}

type StreamHandlers = {
  onToken: (token: string) => void;
  onCitations: (citations: ChatApiResponse["citations"]) => void;
  onRoute?: (route: string) => void;
};

type SseMessage = {
  event: string;
  data: string;
};

function parseSseMessage(raw: string): SseMessage | null {
  const lines = raw.split("\n");
  let event = "";
  let data = "";

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      data += line.slice("data:".length).trim();
    }
  }

  if (!event) {
    return null;
  }

  return { event, data };
}

export async function streamChatQuery(
  query: string,
  handlers: StreamHandlers,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Backend stream request failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const messages = buffer.split("\n\n");
    buffer = messages.pop() ?? "";

    for (const rawMessage of messages) {
      const message = parseSseMessage(rawMessage);
      if (!message) {
        continue;
      }

      if (message.event === "route") {
        const parsed = JSON.parse(message.data) as { route?: string };
        if (parsed.route) {
          handlers.onRoute?.(parsed.route);
        }
      } else if (message.event === "token") {
        const parsed = JSON.parse(message.data) as { token?: string };
        if (parsed.token) {
          handlers.onToken(parsed.token);
        }
      } else if (message.event === "citations") {
        const parsed = JSON.parse(message.data) as {
          citations?: ChatApiResponse["citations"];
        };
        handlers.onCitations(parsed.citations ?? []);
      } else if (message.event === "error") {
        const parsed = JSON.parse(message.data) as { message?: string };
        throw new Error(parsed.message ?? "Streaming request failed.");
      } else if (message.event === "done") {
        return;
      }
    }
  }
}
