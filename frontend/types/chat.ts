export type Citation = {
  case_name: string;
  url: string;
  relevance_score: number;
};

export type ChatApiResponse = {
  answer: string;
  citations: Citation[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};
