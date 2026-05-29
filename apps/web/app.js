const API_BASE_KEY = "squad-room-api-base";
const defaultApiBase = localStorage.getItem(API_BASE_KEY) || "http://localhost:8787";

const members = [
  ["captain", "Captain", "Controls the room and summarizes decisions.", "#2563eb"],
  ["ideator", "Ideator", "Generates original angles and differentiators.", "#f97316"],
  ["engineer", "Engineer", "Checks technical feasibility and implementation path.", "#0891b2"],
  ["strategist", "Strategist", "Thinks about users, market, and value.", "#16a34a"],
  ["designer", "Designer", "Shapes experience, story, and presentation.", "#db2777"],
  ["critic", "Critic", "Finds weak spots and asks hard judge questions.", "#7c3aed"]
].map(([id, name, role, color]) => ({ id, name, role, color }));

const stages = ["Framing", "Brainstorming", "Feasibility", "Challenge", "Convergence", "Action Plan", "Pitch Prep"];
const proposalKeywords = ["建议", "定位", "目标", "用户", "方案", "方向", "差异化", "定义", "proposal", "position", "goal", "user"];
const actionKeywords = ["任务", "下一步", "立刻", "24小时", "测试", "产出", "发布", "执行", "验证", "模板", "build", "next", "step", "test"];
const riskKeywords = ["风险", "漏洞", "假设", "失败", "成本", "屏蔽", "节奏", "不够", "问题", "risk", "weak", "cost", "fail"];
const questionKeywords = ["问题", "评委", "为什么", "是否", "如何证明", "怎么", "question", "why", "whether"];

let apiBase = defaultApiBase;
let meeting = null;
let history = [];
let stageIndex = 0;
let totalTokens = 0;
let isRunningMeeting = false;

const setupView = document.querySelector("#setupView");
const roomView = document.querySelector("#roomView");
const meetingForm = document.querySelector("#meetingForm");
const loadDemoButton = document.querySelector("#loadDemoButton");
const newMeetingButton = document.querySelector("#newMeetingButton");
const runMeetingButton = document.querySelector("#runMeetingButton");
const continueButton = document.querySelector("#continueButton");
const summaryButton = document.querySelector("#summaryButton");
const messageForm = document.querySelector("#messageForm");
const messageInput = document.querySelector("#messageInput");
const messageList = document.querySelector("#messageList");
const squadList = document.querySelector("#squadList");
const outputs = document.querySelector("#outputs");
const roomTitle = document.querySelector("#roomTitle");
const stageBadge = document.querySelector("#stageBadge");
const statusLine = document.querySelector("#statusLine");
const usageLine = document.querySelector("#usageLine");

meetingForm.elements.apiBase.value = apiBase;
renderSquad();
renderOutputs({});
refreshConfig();

meetingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(meetingForm);
  apiBase = String(form.get("apiBase") || defaultApiBase).replace(/\/$/, "");
  localStorage.setItem(API_BASE_KEY, apiBase);
  meeting = {
    topic: form.get("topic"),
    contestType: form.get("contestType"),
    goal: form.get("goal"),
    constraints: form.get("constraints")
  };
  await startMeeting();
});

loadDemoButton.addEventListener("click", () => {
  meetingForm.elements.topic.value = "AI squad room for student competitions";
  meetingForm.elements.contestType.value = "Computer Science Competition";
  meetingForm.elements.goal.value = "Turn a rough product idea into a pitch-ready MVP plan";
  meetingForm.elements.constraints.value = "One week timeline, solo builder, GitHub Pages frontend, local API backend, no leaked API keys.";
  meetingForm.elements.apiBase.value = apiBase;
});

newMeetingButton.addEventListener("click", () => {
  meeting = null;
  history = [];
  stageIndex = 0;
  totalTokens = 0;
  setupView.classList.remove("hidden");
  roomView.classList.add("hidden");
});

continueButton.addEventListener("click", async () => {
  await withBusy(continueButton, "Thinking", async () => {
    await postStream("/api/meeting/continue/stream", { meeting, history, stageIndex });
  });
});

runMeetingButton.addEventListener("click", async () => {
  if (isRunningMeeting) return;
  isRunningMeeting = true;
  await withBusy(runMeetingButton, "Running", async () => {
    while (stageIndex < stages.length - 1) {
      await postStream("/api/meeting/continue/stream", { meeting, history, stageIndex });
    }
    await postStream("/api/meeting/summary/stream", { meeting, history });
    addSystemMessage("Meeting complete. The squad has reached a final brief for this run.", "Complete");
  });
  isRunningMeeting = false;
});

summaryButton.addEventListener("click", async () => {
  await withBusy(summaryButton, "Summarizing", async () => {
    await postStream("/api/meeting/summary/stream", { meeting, history });
  });
});

messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = messageInput.value.trim();
  if (!message) return;
  messageInput.value = "";
  await withBusy(messageForm.querySelector("button"), "Sending", async () => {
    await postStream("/api/meeting/message/stream", { meeting, history, stageIndex, message });
  });
});

async function startMeeting() {
  setupView.classList.add("hidden");
  roomView.classList.remove("hidden");
  roomTitle.textContent = meeting.topic || "Squad Room";
  history = [];
  stageIndex = 0;
  totalTokens = 0;
  renderMessages();
  renderOutputs({});

  await withBusy(meetingForm.querySelector("button"), "Opening", async () => {
    await postStream("/api/meeting/start/stream", meeting);
  });
}

function applyResult(result) {
  stageIndex = result.stageIndex ?? stageIndex;
  if (result.stage) stageBadge.textContent = result.stage;
  if (Array.isArray(result.messages)) history = [...history, ...result.messages];
  applyUsage(result.usage);
  renderMessages();
  renderOutputs(buildLocalBrief(history));
}

function applyUsage(usage = {}) {
  totalTokens += usage.totalTokens || 0;
  usageLine.textContent = `${totalTokens.toLocaleString()} tokens`;
}

function renderSquad() {
  squadList.innerHTML = members
    .map((member) => `
      <article class="member">
        <span class="member-dot" style="background:${member.color}"></span>
        <div>
          <strong>${escapeHtml(member.name)}</strong>
          <span>${escapeHtml(member.role)}</span>
        </div>
      </article>
    `)
    .join("");
}

function renderMessages() {
  messageList.innerHTML = history.map((message) => renderMessageHtml(message)).join("");
  messageList.scrollTop = messageList.scrollHeight;
}

function renderMessageHtml(message) {
  const kind = message.kind || "agent";
  return `
    <article class="message ${kind}" data-message-id="${escapeHtml(message.id)}">
      <div class="message-head">
        <span>${escapeHtml(message.speakerName || message.speakerId)}</span>
        <span class="message-stage">${escapeHtml(message.stage || "")}</span>
      </div>
      <div class="markdown-body">${renderMarkdown(message.content || "")}</div>
    </article>
  `;
}

function upsertMessage(message) {
  const existing = history.find((item) => item.id === message.id);
  if (existing) Object.assign(existing, message);
  else history.push(message);
  renderMessages();
}

function appendToken(id, token) {
  const message = history.find((item) => item.id === id);
  if (!message) return;
  message.content += token;
  const node = messageList.querySelector(`[data-message-id="${cssEscape(id)}"] .markdown-body`);
  if (node) {
    node.innerHTML = renderMarkdown(message.content);
    messageList.scrollTop = messageList.scrollHeight;
  } else {
    renderMessages();
  }
}

function finalizeMessage(message) {
  upsertMessage(message);
  renderOutputs(buildLocalBrief(history));
}

function renderOutputs(data) {
  const sections = [
    ["Current Direction", data.proposal],
    ["Next Actions", data.actions],
    ["Risks", data.risks],
    ["Open Questions", data.questions]
  ];
  outputs.innerHTML = sections
    .map(([title, items]) => {
      const list = Array.isArray(items) && items.length ? items : ["Pending later stages."];
      return `
        <section class="output-block">
          <h4>${title}</h4>
          <ul>${list.map((item) => `<li><div class="brief-markdown">${renderMarkdown(item)}</div></li>`).join("")}</ul>
        </section>
      `;
    })
    .join("");
}

async function refreshConfig() {
  try {
    const config = await getJson("/api/config");
    statusLine.textContent = `${config.mode} mode - ${config.model}`;
  } catch {
    statusLine.textContent = `API offline - ${apiBase}`;
  }
}

async function getJson(path) {
  const response = await fetch(`${apiBase}${path}`);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function postJson(path, payload) {
  const response = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function postStream(path, payload) {
  const response = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok || !response.body) {
    if (response.status === 404 && path.endsWith("/stream")) {
      applyResult(await postJson(path.replace(/\/stream$/, ""), payload));
      return;
    }
    throw new Error((await response.text()) || `Request failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() || "";
    for (const block of blocks) handleStreamEvent(parseEventBlock(block));
  }

  if (buffer.trim()) handleStreamEvent(parseEventBlock(buffer));
}

function parseEventBlock(block) {
  const event = { type: "message", data: null };
  const dataLines = [];
  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith("event:")) event.type = line.slice(6).trim();
    if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  event.data = dataLines.length ? JSON.parse(dataLines.join("\n")) : null;
  return event;
}

function handleStreamEvent(event) {
  const data = event.data || {};
  if (event.type === "meta") {
    stageIndex = data.stageIndex ?? stageIndex;
    if (data.stage) stageBadge.textContent = data.stage;
    return;
  }
  if (event.type === "message_start") return upsertMessage(data.message);
  if (event.type === "token") return appendToken(data.id, data.token || "");
  if (event.type === "message_done") return finalizeMessage(data.message);
  if (event.type === "done") {
    stageIndex = data.stageIndex ?? stageIndex;
    if (data.stage) stageBadge.textContent = data.stage;
    applyUsage(data.usage);
    renderOutputs(buildLocalBrief(history));
    addStageProgressMessage(data.stage);
    return;
  }
  if (event.type === "error") throw new Error(data.message || "Stream failed.");
}

function buildLocalBrief(messages) {
  const useful = messages.filter((message) => message.kind !== "system" && String(message.content || "").trim());
  return {
    proposal: collectBriefItems(useful, ["captain", "strategist", "ideator"], proposalKeywords),
    actions: collectBriefItems(useful, ["engineer", "captain", "designer"], actionKeywords),
    risks: collectBriefItems(useful, ["critic", "engineer", "strategist"], riskKeywords),
    questions: collectBriefItems(useful, ["critic", "strategist", "designer"], questionKeywords)
  };
}

function collectBriefItems(messages, speakerIds, keywords) {
  const result = [];
  for (const speakerId of speakerIds) {
    const speakerMessages = messages.filter((message) => message.speakerId === speakerId).slice(-2);
    for (const message of speakerMessages) {
      const sentence = pickBestSentence(message.content, keywords);
      if (sentence) result.push(`${message.speakerName || speakerId}: ${sentence}`);
    }
  }
  return compactBrief(result);
}

function pickBestSentence(content, keywords) {
  const sentences = splitBriefSentences(content);
  return sentences.find((sentence) => keywords.some((keyword) => sentence.toLowerCase().includes(keyword))) || sentences[0] || "";
}

function splitBriefSentences(content) {
  return String(content || "")
    .replace(/\s+/g, " ")
    .split(/[。！？；\n]/)
    .map((line) => cleanBriefText(line))
    .filter((line) => line.length >= 10)
    .filter((line) => !/^好[，,]/.test(line))
    .slice(0, 8);
}

function cleanBriefText(value) {
  return String(value || "")
    .replace(/^\s*[-*+]\s+/, "")
    .replace(/^\s*\d+\.\s+/, "")
    .replace(/^#{1,6}\s+/, "")
    .replace(/^>\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function compactBrief(items) {
  const seen = new Set();
  const result = items
    .map((item) => cleanBriefText(item))
    .filter(Boolean)
    .filter((item) => {
      const key = normalizeBriefKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 4);
  return result.length ? result : ["Pending later stages."];
}

function normalizeBriefKey(item) {
  return item
    .replace(/^[A-Za-z ]+:\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function addStageProgressMessage(stage) {
  if (!stage || stage === "Summary" || isRunningMeeting) return;
  if (stageIndex >= stages.length - 1) {
    addSystemMessage(`${stage} complete. The stage plan is finished; generate a Summary or add your own follow-up.`, "Stage Complete");
    return;
  }
  const nextStage = stages[stageIndex + 1];
  addSystemMessage(`${stage} complete. Next: ${nextStage}. Use Run Meeting to finish the remaining stages, or Next Stage to advance one step.`, "Stage Complete");
}

function addSystemMessage(content, stage = "System") {
  history.push({
    id: crypto.randomUUID(),
    speakerId: "system",
    speakerName: "System",
    kind: "system",
    content,
    stage,
    createdAt: new Date().toISOString()
  });
  renderMessages();
}

async function withBusy(button, label, task) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = label;
  try {
    await task();
  } catch (error) {
    addSystemMessage(error.message || "Something went wrong.", "Error");
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

function renderMarkdown(markdown) {
  const source = String(markdown || "");
  if (!source.trim()) return '<span class="stream-cursor"></span>';
  if (window.marked && window.DOMPurify) {
    const html = window.marked.parse(source, { breaks: true, gfm: true });
    return window.DOMPurify.sanitize(html, {
      ADD_ATTR: ["target", "rel"],
      FORBID_TAGS: ["style", "script", "iframe", "object", "embed"]
    });
  }
  return renderBasicMarkdown(source);
}

function renderBasicMarkdown(source) {
  const lines = source.split(/\r?\n/);
  const html = [];
  let listType = "";

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      closeList();
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      closeList();
      html.push(`<h${heading[1].length}>${inlineMarkdown(heading[2])}</h${heading[1].length}>`);
      continue;
    }
    const unordered = line.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      openList("ul");
      html.push(`<li>${inlineMarkdown(unordered[1])}</li>`);
      continue;
    }
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      openList("ol");
      html.push(`<li>${inlineMarkdown(ordered[1])}</li>`);
      continue;
    }
    closeList();
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  closeList();
  return html.join("");

  function openList(type) {
    if (listType === type) return;
    closeList();
    listType = type;
    html.push(`<${type}>`);
  }

  function closeList() {
    if (!listType) return;
    html.push(`</${listType}>`);
    listType = "";
  }
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+?)`/g, "<code>$1</code>");
}

function cssEscape(value) {
  if (window.CSS && window.CSS.escape) return window.CSS.escape(value);
  return String(value).replace(/["\\]/g, "\\$&");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
