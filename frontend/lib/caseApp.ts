const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export const API_URL = `${API_BASE_URL}/api/chat`;

export type NormalizedResponse = {
  explanation: string;
  legalPrinciples: string[];
  cases: CaseLawItem[];
  statutes: StatuteItem[];
  evidenceChecklist: string[];
  nextSteps: string[];
  citations: CitationItem[];
  disclaimer: string;
};

export type CaseLawItem = {
  name?: string;
  title?: string;
  citation?: string;
  summary?: string;
  sourceUrl?: string;
  url?: string;
};

export type StatuteItem = {
  act?: string;
  name?: string;
  section?: string;
  provision?: string;
  summary?: string;
  sourceUrl?: string;
  url?: string;
};

export type CitationItem = {
  title?: string;
  snippet?: string;
  url?: string;
  type?: string;
};

export type ChatRecord = {
  id: string;
  title: string;
  query: string;
  data: NormalizedResponse;
  sourceLabel: string;
  updatedAt: string;
};

export const MOCK_RESPONSE: NormalizedResponse = {
  explanation:
    "Your situation may involve a retaliatory eviction claim. Under Ontario rules, eviction actions connected to tenant rights complaints can be challenged before the LTB.",
  legalPrinciples: [
    "Landlords must follow lawful eviction procedures through the LTB.",
    "Tenants can raise defenses where notice is linked to rights enforcement.",
    "Evidence quality strongly affects hearing outcomes.",
  ],
  cases: [
    {
      name: "Example v. Example",
      citation: "2021 ONLTB 12345",
      summary:
        "The tribunal considered whether eviction steps were connected to a maintenance complaint.",
      sourceUrl: "https://www.canlii.org/",
    },
  ],
  statutes: [
    {
      act: "Residential Tenancies Act, 2006",
      section: "s. 83",
      summary: "The Board may refuse or delay eviction where fairness requires.",
      sourceUrl: "https://www.ontario.ca/laws/statute/06r17",
    },
  ],
  evidenceChecklist: [
    "Photos/videos of mold and dates captured",
    "Written complaint records to landlord",
    "Eviction notice copies and service dates",
    "Medical or repair records if relevant",
  ],
  nextSteps: [
    "Confirm timelines in your notice and hearing documents.",
    "Organize evidence in chronological order.",
    "Prepare short statements connecting facts to legal points.",
  ],
  citations: [
    {
      title: "Residential Tenancies Act, 2006",
      url: "https://www.ontario.ca/laws/statute/06r17",
      snippet: "Official Ontario statute text.",
      type: "statute",
    },
    {
      title: "CanLII Ontario decisions",
      url: "https://www.canlii.org/en/on/",
      snippet: "Case law database for Ontario.",
      type: "case",
    },
  ],
  disclaimer:
    "This tool provides legal information, not legal advice. Consider speaking with a licensed lawyer or legal clinic.",
};

export function normalizeResponse(data: Record<string, unknown>): NormalizedResponse {
  const explanation =
    (data.explanation as string) ||
    (data.summary as string) ||
    (data.issueExplanation as string) ||
    "";
  const legalPrinciples =
    (data.legalPrinciples as string[]) ||
    (data.principles as string[]) ||
    (data.keyPrinciples as string[]) ||
    [];
  const cases = (data.cases as CaseLawItem[]) || (data.caseLaw as CaseLawItem[]) || [];
  const statutes = (data.statutes as StatuteItem[]) || (data.laws as StatuteItem[]) || [];
  const evidenceChecklist =
    (data.evidenceChecklist as string[]) ||
    (data.checklist as string[]) ||
    (data.evidence as string[]) ||
    [];
  const nextSteps =
    (data.nextSteps as string[]) ||
    (data.next_steps as string[]) ||
    (data.suggestedNextSteps as string[]) ||
    [];
  const citations = normalizeCitations(data);
  const disclaimer =
    (data.disclaimer as string) ||
    "This tool provides legal information, not legal advice. Consider speaking with a licensed lawyer or legal clinic.";

  return {
    explanation,
    legalPrinciples,
    cases,
    statutes,
    evidenceChecklist,
    nextSteps,
    citations,
    disclaimer,
  };
}

function normalizeCitations(data: Record<string, unknown>): CitationItem[] {
  const rawItems = (data.citations as Record<string, unknown>[]) || (data.sources as CitationItem[]) || [];

  return rawItems.map((item) => ({
    title:
      (item.title as string) ||
      (item.case_name as string) ||
      (item.label as string) ||
      "Citation",
    snippet: item.snippet as string | undefined,
    url: item.url as string | undefined,
    type: (item.type as string) || (item.source_type as string | undefined),
  }));
}

export function escapeHtml(value: string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function linkifyText(value: string) {
  const escaped = escapeHtml(value || "");
  return escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noreferrer">$1</a>'
  );
}

export function getSourceCount(data: NormalizedResponse) {
  const directCitations = (data.citations || []).length;
  if (directCitations > 0) return directCitations;
  const caseSources = (data.cases || []).filter((item) => item.sourceUrl || item.url).length;
  const statuteSources = (data.statutes || []).filter((item) => item.sourceUrl || item.url).length;
  return caseSources + statuteSources;
}

export function formatListForCopy(title: string, items: string[]) {
  if (!items.length) return `${title}\n- No items available`;
  return `${title}\n${items.map((item) => `- ${item}`).join("\n")}`;
}

export function formatObjectListForCopy<T>(
  title: string,
  items: T[],
  formatItem: (item: T) => string
) {
  if (!items.length) return `${title}\n- No items available`;
  return `${title}\n${items.map((item) => `- ${formatItem(item)}`).join("\n")}`;
}

export function buildSectionCopyText(
  target: string,
  title: string,
  data: NormalizedResponse
) {
  if (target === "case-snapshot") {
    const explanation = data.explanation
      ? `Summary: ${data.explanation}`
      : "Summary: No summary available";
    const principles = formatListForCopy("Legal Principles", data.legalPrinciples || []);
    return `${title}\n${explanation}\n\n${principles}`;
  }
  if (target === "next-steps") {
    return formatListForCopy(title, data.nextSteps || []);
  }
  if (target === "checklist") {
    return formatListForCopy(title, data.evidenceChecklist || []);
  }
  if (target === "authorities") {
    const caseLines = formatObjectListForCopy("Cases", data.cases || [], (item) => {
      const name = item.name || item.title || "Case";
      const citation = item.citation ? ` (${item.citation})` : "";
      return `${name}${citation}${item.sourceUrl || item.url ? ` - ${item.sourceUrl || item.url}` : ""}`;
    });
    const statuteLines = formatObjectListForCopy("Statutes", data.statutes || [], (item) => {
      const act = item.act || item.name || "Statute";
      const section = item.section || item.provision ? ` ${item.section || item.provision}` : "";
      return `${act}${section}${item.sourceUrl || item.url ? ` - ${item.sourceUrl || item.url}` : ""}`;
    });
    return `${title}\n\n${caseLines}\n\n${statuteLines}`;
  }
  if (target === "sources") {
    return formatObjectListForCopy(title, data.citations || [], (item) => {
      const itemTitle = item.title || "Citation";
      const snippet = item.snippet ? `: ${item.snippet}` : "";
      const url = item.url ? ` - ${item.url}` : "";
      return `${itemTitle}${snippet}${url}`;
    });
  }
  if (target === "disclaimer") {
    return `${title}\n${data.disclaimer || "No disclaimer provided."}`;
  }
  return `${title}\nNo data available`;
}

const STORAGE_KEY = "caseline.chats";

export function loadChats(): ChatRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as ChatRecord[];
  } catch {
    return [];
  }
}

export function saveChats(chats: ChatRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

export function formatTime(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
