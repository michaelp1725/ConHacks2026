export type Citation = {
  case_name: string;
  url: string;
  relevance_score: number;
  source_type: "case" | "law";
  label: string;
};

export type ChatApiResponse = {
  explanation: string;
  checklist: string[];
  next_steps: string[];
  disclaimer: string;
  citations: Citation[];
  route: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  checklist?: string[];
  next_steps?: string[];
  disclaimer?: string;
  citations?: Citation[];
  route?: string;
};
