const API_URL = "http://localhost:8000/ask";

const MOCK_RESPONSE = {
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

const form = document.getElementById("ask-form");
const statusText = document.getElementById("status-text");
const results = document.getElementById("results");
const sampleBtn = document.getElementById("sample-btn");
const onboarding = document.getElementById("onboarding");
const appShell = document.getElementById("app-shell");
const getStartedBtn = document.getElementById("get-started-btn");
const actionBar = document.getElementById("action-bar");
const resultCounts = document.getElementById("result-counts");
const copyChecklistBtn = document.getElementById("copy-checklist-btn");
const copyNextStepsBtn = document.getElementById("copy-next-steps-btn");
const refineBtn = document.getElementById("refine-btn");
const newChatBtn = document.getElementById("new-chat-btn");
const chatList = document.getElementById("chat-list");

let latestRenderedData = null;
let chats = loadChats();
let activeChatId = chats[0]?.id || null;

syncViewModeFromDom();
renderChatList();
if (!chats.length) {
  seedStarterChats();
}
if (chats.length) {
  const initial = chats.find((chat) => chat.id === activeChatId) || chats[0];
  activeChatId = initial.id;
  document.getElementById("query").value = initial.query || "";
}

getStartedBtn.addEventListener("click", () => {
  setViewMode(false);
  onboarding.classList.add("hidden");
  appShell.classList.remove("hidden");
  if (activeChatId) {
    const initial = chats.find((chat) => chat.id === activeChatId);
    if (initial && initial.data) {
      renderResults(initial.data, initial.sourceLabel || "Saved response");
      statusText.textContent = "Loaded most recent case.";
    }
  }
  document.getElementById("query").focus();
});

sampleBtn.addEventListener("click", () => {
  document.getElementById("query").value =
    "I received an eviction notice after requesting urgent repairs for mold and water damage.";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitBtn = document.getElementById("submit-btn");
  const query = document.getElementById("query").value.trim();

  if (!query) {
    statusText.textContent = "Please describe your legal situation.";
    return;
  }

  statusText.textContent = "Analyzing your question...";
  submitBtn.disabled = true;
  submitBtn.textContent = "Analyzing...";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: query }),
    });

    if (!response.ok) {
      throw new Error("Backend returned a non-200 response.");
    }

    const data = await response.json();
    const normalized = normalizeResponse(data);
    renderResults(normalized, "Live backend response");
    persistChat(query, normalized, "Live backend response");
    statusText.textContent = "Results generated from backend.";
  } catch (error) {
    // Fallback keeps the demo usable if backend is down.
    renderResults(MOCK_RESPONSE, "Demo fallback response");
    persistChat(query, MOCK_RESPONSE, "Demo fallback response");
    statusText.textContent =
      "Backend unavailable, showing demo response. Update API_URL when backend is ready.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Build My Case Strategy";
  }
});

function normalizeResponse(data) {
  const explanation =
    data.explanation || data.summary || data.issueExplanation || "";
  const legalPrinciples =
    data.legalPrinciples || data.principles || data.keyPrinciples || [];
  const cases = data.cases || data.caseLaw || [];
  const statutes = data.statutes || data.laws || [];
  const evidenceChecklist =
    data.evidenceChecklist || data.checklist || data.evidence || [];
  const nextSteps = data.nextSteps || data.suggestedNextSteps || [];
  const citations = data.citations || data.sources || [];
  const disclaimer =
    data.disclaimer ||
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

function renderResults(data, sourceLabel = "Saved response") {
  latestRenderedData = data;
  results.classList.remove("hidden");
  const appVisible = !appShell.classList.contains("hidden");
  if (appVisible) {
    actionBar.classList.remove("hidden");
  }
  setRichText("explanation", data.explanation);
  setText("disclaimer", data.disclaimer);

  renderList("principles", data.legalPrinciples || []);
  renderList("checklist", data.evidenceChecklist || []);
  renderList("next-steps", data.nextSteps || []);
  renderObjectEntries("authorities", data.cases || [], (item) => `
    <span class="entry-tag">case</span>
    <p><strong>${escapeHtml(item.name || item.title || "Case")}</strong> (${escapeHtml(item.citation || "N/A")})</p>
    <p>${linkifyText(item.summary || "")}</p>
    ${item.sourceUrl || item.url ? `<a href="${item.sourceUrl || item.url}" target="_blank" rel="noreferrer">Open source</a>` : ""}
  `);
  appendObjectEntries("authorities", data.statutes || [], (item) => `
    <span class="entry-tag">statute</span>
    <p><strong>${escapeHtml(item.act || item.name || "Statute")}</strong> - ${escapeHtml(item.section || item.provision || "")}</p>
    <p>${linkifyText(item.summary || "")}</p>
    ${item.sourceUrl || item.url ? `<a href="${item.sourceUrl || item.url}" target="_blank" rel="noreferrer">Open source</a>` : ""}
  `);
  renderObjectEntries("citations", data.citations || [], (item) => `
    <span class="entry-tag">${escapeHtml(item.type || "source")}</span>
    <p><strong>${escapeHtml(item.title || "Citation")}</strong></p>
    <p>${linkifyText(item.snippet || "")}</p>
    ${item.url ? `<a href="${item.url}" target="_blank" rel="noreferrer">${item.url}</a>` : ""}
  `);

  setResultMetaCount(data);
}

function setText(id, value) {
  document.getElementById(id).textContent = value || "";
}

function setRichText(id, value) {
  document.getElementById(id).innerHTML = linkifyText(value || "");
}

function renderList(id, items) {
  const target = document.getElementById(id);
  target.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    target.appendChild(li);
  });
}

function renderObjectEntries(id, items, renderer) {
  const target = document.getElementById(id);
  target.innerHTML = "";

  if (!items.length) {
    target.innerHTML = '<p class="status">No entries provided.</p>';
    return;
  }

  items.forEach((item) => {
    const div = document.createElement("div");
    div.className = "entry";
    div.innerHTML = renderer(item);
    target.appendChild(div);
  });
}

function appendObjectEntries(id, items, renderer) {
  const target = document.getElementById(id);
  items.forEach((item) => {
    const div = document.createElement("div");
    div.className = "entry";
    div.innerHTML = renderer(item);
    target.appendChild(div);
  });
}

function setResultMetaCount(data) {
  const sourceCount = getSourceCount(data);
  const caseCount = (data.cases || []).length;
  const statuteCount = (data.statutes || []).length;
  resultCounts.textContent = `${sourceCount} sources • ${caseCount} cases • ${statuteCount} statutes`;
}

function getSourceCount(data) {
  const directCitations = (data.citations || []).length;
  if (directCitations > 0) {
    return directCitations;
  }
  const caseSources = (data.cases || []).filter((item) => item.sourceUrl || item.url).length;
  const statuteSources = (data.statutes || []).filter((item) => item.sourceUrl || item.url).length;
  return caseSources + statuteSources;
}

copyChecklistBtn.addEventListener("click", async () => {
  if (!latestRenderedData) return;
  const text = formatListForCopy("Evidence Checklist", latestRenderedData.evidenceChecklist || []);
  await copyText(text, "Checklist copied");
});

copyNextStepsBtn.addEventListener("click", async () => {
  if (!latestRenderedData) return;
  const text = formatListForCopy("Suggested Next Steps", latestRenderedData.nextSteps || []);
  await copyText(text, "Next steps copied");
});

refineBtn.addEventListener("click", () => {
  document.getElementById("query").focus();
  statusText.textContent = "Add more details and re-run to refine your case strategy.";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

results.addEventListener("click", async (event) => {
  const button = event.target.closest(".copy-section-btn");
  if (!button || !latestRenderedData) return;

  const target = button.dataset.copyTarget;
  const title = button.dataset.copyTitle || "Section";
  const content = buildSectionCopyText(target, title, latestRenderedData);
  await copyText(content, `${title} copied`);
});

newChatBtn.addEventListener("click", () => {
  activeChatId = null;
  form.reset();
  results.classList.add("hidden");
  actionBar.classList.add("hidden");
  statusText.textContent = "New chat started. Describe your legal issue.";
  renderChatList();
  document.getElementById("query").focus();
});

function persistChat(query, data, sourceLabel) {
  const title = query.slice(0, 64) + (query.length > 64 ? "..." : "");
  const id = activeChatId || crypto.randomUUID();
  const updatedAt = new Date().toISOString();

  const nextChat = { id, title, query, data, sourceLabel, updatedAt };
  const existingIdx = chats.findIndex((chat) => chat.id === id);
  if (existingIdx >= 0) {
    chats[existingIdx] = nextChat;
  } else {
    chats.unshift(nextChat);
  }

  activeChatId = id;
  chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  chats = chats.slice(0, 15);
  saveChats();
  renderChatList();
}

function renderChatList() {
  chatList.innerHTML = "";
  chats.forEach((chat) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `chat-item ${chat.id === activeChatId ? "active" : ""}`.trim();
    btn.innerHTML = `
      <div class="chat-title">${escapeHtml(chat.title || "Untitled chat")}</div>
      <div class="chat-time">${formatTime(chat.updatedAt)}</div>
    `;
    btn.addEventListener("click", () => {
      activeChatId = chat.id;
      setViewMode(false);
      onboarding.classList.add("hidden");
      appShell.classList.remove("hidden");
      document.getElementById("query").value = chat.query || "";
      renderResults(chat.data, chat.sourceLabel || "Saved response");
      statusText.textContent = "Loaded saved chat.";
      renderChatList();
    });
    chatList.appendChild(btn);
  });
}

function seedStarterChats() {
  chats = [
    {
      id: crypto.randomUUID(),
      title: "Mold complaint and eviction notice",
      query:
        "I received an eviction notice after requesting urgent repairs for mold and water damage.",
      data: MOCK_RESPONSE,
      sourceLabel: "Demo fallback response",
      updatedAt: new Date().toISOString(),
    },
  ];
  activeChatId = chats[0].id;
  saveChats();
  renderChatList();
}

function loadChats() {
  try {
    return JSON.parse(localStorage.getItem("caseline.chats") || "[]");
  } catch (error) {
    return [];
  }
}

function saveChats() {
  localStorage.setItem("caseline.chats", JSON.stringify(chats));
}

function setViewMode(isOnboarding) {
  document.body.classList.toggle("onboarding-view", isOnboarding);
  if (isOnboarding) {
    actionBar.classList.add("hidden");
  }
}

function syncViewModeFromDom() {
  setViewMode(!onboarding.classList.contains("hidden"));
}

function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatListForCopy(title, items) {
  if (!items.length) return `${title}\n- No items available`;
  return `${title}\n${items.map((item) => `- ${item}`).join("\n")}`;
}

function formatObjectListForCopy(title, items, formatItem) {
  if (!items.length) return `${title}\n- No items available`;
  return `${title}\n${items.map((item) => `- ${formatItem(item)}`).join("\n")}`;
}

function buildSectionCopyText(target, title, data) {
  if (target === "case-snapshot") {
    const explanation = data.explanation ? `Summary: ${data.explanation}` : "Summary: No summary available";
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

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    document.getElementById("action-status").textContent = successMessage;
  } catch (error) {
    document.getElementById("action-status").textContent =
      "Clipboard blocked by browser. You can copy manually.";
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function linkifyText(value) {
  const escaped = escapeHtml(value);
  return escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noreferrer">$1</a>'
  );
}
