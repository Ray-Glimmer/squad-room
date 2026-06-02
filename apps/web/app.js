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
const MATERIAL_TEXT_LIMIT = 12000;
const MATERIAL_FILE_SIZE_LIMIT = 10 * 1024 * 1024;

let apiBase = defaultApiBase;
let meeting = null;
let history = [];
let stageIndex = 0;
let totalTokens = 0;
let isRunningMeeting = false;
let isPaused = false;
let resumeAutomaticRun = false;
let activeStreamController = null;
let pausedStreamRequest = null;
let streamEpoch = 0;
let abortReason = "";
let isDrainingUserQueue = false;
let pendingUserMessages = [];
let currentBrief = {};
let availableSkills = [];
let availableTools = [];
let toolActivities = [];
let backgroundTasks = [];
let materialFiles = [];

const setupView = document.querySelector("#setupView");
const roomView = document.querySelector("#roomView");
const meetingForm = document.querySelector("#meetingForm");
const loadDemoButton = document.querySelector("#loadDemoButton");
const newMeetingButton = document.querySelector("#newMeetingButton");
const runMeetingButton = document.querySelector("#runMeetingButton");
const continueButton = document.querySelector("#continueButton");
const summaryButton = document.querySelector("#summaryButton");
const pauseButton = document.querySelector("#pauseButton");
const messageForm = document.querySelector("#messageForm");
const messageInput = document.querySelector("#messageInput");
const interruptionBar = document.querySelector("#interruptionBar");
const interruptionCount = document.querySelector("#interruptionCount");
const interruptNowButton = document.querySelector("#interruptNowButton");
const messageList = document.querySelector("#messageList");
const squadList = document.querySelector("#squadList");
const skillList = document.querySelector("#skillList");
const outputs = document.querySelector("#outputs");
const activityCount = document.querySelector("#activityCount");
const activityList = document.querySelector("#activityList");
const backgroundTaskCount = document.querySelector("#backgroundTaskCount");
const backgroundTaskList = document.querySelector("#backgroundTaskList");
const toolRegistry = document.querySelector("#toolRegistry");
const materialFileInput = document.querySelector("#materialFileInput");
const materialFileButton = document.querySelector("#materialFileButton");
const materialFileList = document.querySelector("#materialFileList");
const roomTitle = document.querySelector("#roomTitle");
const stageBadge = document.querySelector("#stageBadge");
const statusLine = document.querySelector("#statusLine");
const usageLine = document.querySelector("#usageLine");
const autoResearchToggle = document.querySelector("#autoResearchToggle");

meetingForm.elements.apiBase.value = apiBase;
renderSquad();
renderSkills();
renderTools();
renderOutputs({});
renderActivities();
renderBackgroundTasks();
renderInterruptionQueue();
renderMaterialFiles();
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
    constraints: form.get("constraints"),
    projectMaterials: form.get("projectMaterials"),
    researchContext: "",
    autoWebResearch: form.get("autoWebResearch") === "on"
  };
  await startMeeting();
});

loadDemoButton.addEventListener("click", () => {
  meetingForm.elements.topic.value = "AI squad room for student competitions";
  meetingForm.elements.contestType.value = "Computer Science Competition";
  meetingForm.elements.goal.value = "Turn a rough product idea into a pitch-ready MVP plan";
  meetingForm.elements.constraints.value = "One week timeline, solo builder, GitHub Pages frontend, local API backend, no leaked API keys.";
  meetingForm.elements.projectMaterials.value = "Judging criteria: working demo, feasibility, user value, and pitch clarity. Existing idea: a personal AI squad room.";
  meetingForm.elements.apiBase.value = apiBase;
});

newMeetingButton.addEventListener("click", () => {
  pauseMeeting({ announce: false });
  streamEpoch += 1;
  meeting = null;
  history = [];
  stageIndex = 0;
  totalTokens = 0;
  currentBrief = {};
  toolActivities = [];
  backgroundTasks = [];
  pendingUserMessages = [];
  materialFiles = [];
  isPaused = false;
  resumeAutomaticRun = false;
  pausedStreamRequest = null;
  renderPauseState();
  renderMaterialFiles();
  renderBackgroundTasks();
  renderInterruptionQueue();
  setupView.classList.remove("hidden");
  roomView.classList.add("hidden");
});

interruptNowButton.addEventListener("click", () => {
  if (!pendingUserMessages.length || !activeStreamController) return;
  abortReason = "user_interruption";
  activeStreamController.abort();
});

pauseButton.addEventListener("click", async () => {
  if (!isPaused) {
    pauseMeeting();
    return;
  }
  isPaused = false;
  renderPauseState();
  addSystemMessage("Meeting resumed.", "Control");
  if (resumeAutomaticRun) {
    resumeAutomaticRun = false;
    await runMeeting();
    return;
  }
  if (pausedStreamRequest) {
    const request = pausedStreamRequest;
    pausedStreamRequest = null;
    try {
      await postStream(request.path, request.payload);
      await drainUserQueue();
    } catch (error) {
      if (error.name !== "AbortError") addSystemMessage(error.message || "Something went wrong.", "Error");
    }
  }
});

autoResearchToggle.addEventListener("change", () => {
  if (!meeting) return;
  meeting.autoWebResearch = autoResearchToggle.checked;
  meetingForm.elements.autoWebResearch.checked = autoResearchToggle.checked;
  addSystemMessage(
    autoResearchToggle.checked
      ? "Automatic web research is enabled. Agents may send visible search queries without per-search approval."
      : "Automatic web research is disabled. New search queries will wait for approval.",
    "Research"
  );
});

materialFileButton.addEventListener("click", () => materialFileInput.click());

materialFileInput.addEventListener("change", async () => {
  const files = [...materialFileInput.files];
  materialFileInput.value = "";
  for (const file of files) {
    await importMaterialFile(file);
  }
});

continueButton.addEventListener("click", async () => {
  if (isPaused || activeStreamController) return;
  await withBusy(continueButton, "Thinking", async () => {
    await postStream("/api/meeting/continue/stream", { meeting, history, stageIndex });
  });
  await drainUserQueue();
});

runMeetingButton.addEventListener("click", async () => {
  await runMeeting();
});

summaryButton.addEventListener("click", async () => {
  if (isPaused || activeStreamController) return;
  await withBusy(summaryButton, "Summarizing", async () => {
    await postStream("/api/meeting/summary/stream", { meeting, history });
  });
  await drainUserQueue();
});

messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = messageInput.value.trim();
  if (!message || isPaused) return;
  messageInput.value = "";
  pendingUserMessages.push({ id: crypto.randomUUID(), message });
  renderInterruptionQueue();
  await drainUserQueue();
});

async function startMeeting() {
  streamEpoch += 1;
  setupView.classList.add("hidden");
  roomView.classList.remove("hidden");
  roomTitle.textContent = meeting.topic || "Squad Room";
  history = [];
  stageIndex = 0;
  totalTokens = 0;
  currentBrief = {};
  toolActivities = [];
  backgroundTasks = [];
  pendingUserMessages = [];
  isPaused = false;
  resumeAutomaticRun = false;
  pausedStreamRequest = null;
  renderPauseState();
  autoResearchToggle.checked = Boolean(meeting.autoWebResearch);
  renderMessages();
  renderOutputs({});
  renderActivities();
  renderBackgroundTasks();
  renderInterruptionQueue();

  await withBusy(meetingForm.querySelector("button"), "Opening", async () => {
    await postStream("/api/meeting/start/stream", meeting);
  });
  await drainUserQueue();
}

async function runMeeting() {
  if (isRunningMeeting || isPaused || activeStreamController) return;
  isRunningMeeting = true;
  await withBusy(runMeetingButton, "Running", async () => {
    while (!isPaused && stageIndex < stages.length - 1) {
      await postStream("/api/meeting/continue/stream", { meeting, history, stageIndex });
      await drainUserQueue();
    }
    if (isPaused) return;
    await postStream("/api/meeting/summary/stream", { meeting, history });
    if (!isPaused) addSystemMessage("Meeting complete. The squad has reached a final brief for this run.", "Complete");
  });
  isRunningMeeting = false;
}

async function drainUserQueue() {
  if (isDrainingUserQueue || isPaused || activeStreamController) return;
  isDrainingUserQueue = true;
  try {
    while (!isPaused && !activeStreamController && pendingUserMessages.length) {
      const next = pendingUserMessages.shift();
      renderInterruptionQueue();
      await withBusy(messageForm.querySelector("button"), "Sending", async () => {
        await postStream("/api/meeting/message/stream", { meeting, history, stageIndex, message: next.message });
      });
    }
  } finally {
    isDrainingUserQueue = false;
    renderInterruptionQueue();
  }
}

function renderInterruptionQueue() {
  const count = pendingUserMessages.length;
  interruptionBar.classList.toggle("hidden", count === 0);
  interruptionCount.textContent = `${count} pending ${count === 1 ? "message" : "messages"}`;
  interruptNowButton.disabled = !activeStreamController;
}

function pauseMeeting({ announce = true } = {}) {
  if (isPaused && !activeStreamController) return;
  resumeAutomaticRun = isRunningMeeting;
  isPaused = true;
  abortReason = "pause";
  activeStreamController?.abort();
  renderPauseState();
  if (announce) addSystemMessage("Meeting paused. The current request was stopped; resume to continue from the last completed stage.", "Control");
}

function renderPauseState() {
  pauseButton.textContent = isPaused ? "Resume" : "Pause";
  pauseButton.classList.toggle("active", isPaused);
  runMeetingButton.disabled = isPaused;
  continueButton.disabled = isPaused;
  summaryButton.disabled = isPaused;
  messageInput.disabled = isPaused;
  messageForm.querySelector("button").disabled = isPaused;
}

function applyResult(result) {
  stageIndex = result.stageIndex ?? stageIndex;
  if (result.stage) stageBadge.textContent = result.stage;
  if (Array.isArray(result.messages)) history = [...history, ...result.messages];
  applyUsage(result.usage);
  renderMessages();
  currentBrief = result.outputs || currentBrief;
  renderOutputs(currentBrief);
  addToolActivities(result.toolActivities);
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
    availableSkills = config.skills || [];
    availableTools = config.tools || [];
    renderSkills();
    renderTools();
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
  const requestEpoch = streamEpoch;
  const previousStageIndex = stageIndex;
  const previousStageLabel = stageBadge.textContent;
  const previousBrief = currentBrief;
  const previousMessageIds = new Set(history.map((message) => message.id));
  const controller = new AbortController();
  activeStreamController = controller;
  renderInterruptionQueue();
  try {
    const response = await fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
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
    if (requestEpoch === streamEpoch) pausedStreamRequest = null;
  } catch (error) {
    if (error.name === "AbortError" && requestEpoch === streamEpoch) {
      const currentAbortReason = abortReason;
      stageIndex = previousStageIndex;
      stageBadge.textContent = previousStageLabel;
      currentBrief = previousBrief;
      history = history.filter((message) => previousMessageIds.has(message.id));
      renderMessages();
      renderOutputs(currentBrief);
      pausedStreamRequest = currentAbortReason === "pause" ? { path, payload } : null;
      if (currentAbortReason === "user_interruption") return false;
    }
    throw error;
  } finally {
    if (activeStreamController === controller) {
      activeStreamController = null;
      abortReason = "";
    }
    renderInterruptionQueue();
  }
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
  if (event.type === "brief") {
    currentBrief = data.outputs || {};
    renderOutputs(currentBrief);
    return;
  }
  if (event.type === "tool_activity") {
    addToolActivities([data]);
    return;
  }
  if (event.type === "background_task") {
    addBackgroundTask(data);
    return;
  }
  if (event.type === "done") {
    stageIndex = data.stageIndex ?? stageIndex;
    if (data.stage) stageBadge.textContent = data.stage;
    applyUsage(data.usage);
    currentBrief = data.outputs || currentBrief;
    renderOutputs(currentBrief);
    addToolActivities(data.toolActivities);
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
    if (error.name !== "AbortError") addSystemMessage(error.message || "Something went wrong.", "Error");
  } finally {
    button.disabled = false;
    button.textContent = original;
    renderPauseState();
  }
}

function renderMarkdown(markdown) {
  const source = String(markdown || "");
  if (!source.trim()) return '<span class="stream-cursor"></span>';
  const repaired = repairMarkdown(source);
  if (window.marked && window.DOMPurify) {
    const protectedMarkdown = protectStrongMarkdown(repaired);
    const parsed = window.marked.parse(protectedMarkdown.markdown, { breaks: true, gfm: true });
    const html = restoreStrongHtml(parsed, protectedMarkdown.values);
    return window.DOMPurify.sanitize(html, {
      ADD_ATTR: ["target", "rel"],
      FORBID_TAGS: ["style", "script", "iframe", "object", "embed"]
    });
  }
  return renderBasicMarkdown(repaired);
}

function renderSkills() {
  skillList.innerHTML = availableSkills.length
    ? availableSkills.map((skill) => `<span class="skill-chip">${escapeHtml(skill.name)}</span>`).join("")
    : '<span class="muted-line">Loading...</span>';
}

function renderTools() {
  toolRegistry.innerHTML = availableTools.length
    ? availableTools.map((tool) => `
        <div class="tool-registry-item">
          <strong>${escapeHtml(tool.name)}</strong>
          <span>${tool.approval === "user" ? "Auto request · approval" : "Automatic"}</span>
        </div>
      `).join("")
    : '<span class="muted-line">Loading...</span>';
}

function addToolActivities(activities = []) {
  for (const activity of activities || []) {
    if (!activity) continue;
    const existingIndex = activity.automationKey
      ? toolActivities.findIndex((item) => item.automationKey === activity.automationKey)
      : -1;
    const existing = existingIndex >= 0 ? toolActivities[existingIndex] : null;
    if (existingIndex >= 0) toolActivities.splice(existingIndex, 1);
    toolActivities.unshift(activity);
    if (!existing || existing.status !== "completed") appendResearchContext(activity);
  }
  toolActivities = toolActivities.slice(0, 20);
  renderActivities();
}

function renderActivities() {
  activityCount.textContent = String(toolActivities.length);
  activityList.innerHTML = toolActivities.length
    ? toolActivities.map((activity) => renderActivity(activity)).join("")
    : '<p class="muted-line">No tool activity yet.</p>';
}

function addBackgroundTask(task) {
  if (!task?.id) return;
  const existingIndex = backgroundTasks.findIndex((item) => item.id === task.id);
  if (existingIndex >= 0) backgroundTasks.splice(existingIndex, 1);
  backgroundTasks.unshift(task);
  backgroundTasks = backgroundTasks.slice(0, 20);
  renderBackgroundTasks();
}

function renderBackgroundTasks() {
  backgroundTaskCount.textContent = String(backgroundTasks.length);
  backgroundTaskList.innerHTML = backgroundTasks.length
    ? backgroundTasks.map((task) => `
        <div class="background-task ${escapeHtml(task.status || "queued")}">
          <div>
            <strong>${escapeHtml(task.ownerAgent || "agent")} - ${escapeHtml(task.name || "Background task")}</strong>
            <span>${escapeHtml(task.query || task.message || "")}</span>
          </div>
          <b>${escapeHtml(formatTaskStatus(task.status))}</b>
        </div>
      `).join("")
    : '<p class="muted-line">No background tasks yet.</p>';
}

function formatTaskStatus(status) {
  if (status === "approval_required") return "approval";
  return String(status || "queued").replaceAll("_", " ");
}

async function importMaterialFile(file) {
  const item = {
    id: crypto.randomUUID(),
    name: file.name,
    status: "reading",
    message: "Reading locally..."
  };
  materialFiles.push(item);
  renderMaterialFiles();

  try {
    if (file.size > MATERIAL_FILE_SIZE_LIMIT) {
      throw new Error("File is larger than 10 MB.");
    }
    const text = cleanImportedText(await extractFileText(file));
    if (!text) throw new Error("No readable text was found.");
    const truncated = appendProjectMaterial(file.name, text);
    item.status = "ready";
    item.message = truncated
      ? `${MATERIAL_TEXT_LIMIT.toLocaleString()} total characters kept; extra text truncated`
      : `${text.length.toLocaleString()} characters imported`;
  } catch (error) {
    item.status = "error";
    item.message = error.message || "Could not read this file.";
  }
  renderMaterialFiles();
}

async function extractFileText(file) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (["txt", "md", "markdown", "csv", "tsv", "json", "html", "htm", "xml", "yaml", "yml"].includes(extension)) {
    return file.text();
  }
  if (extension === "pdf") return extractPdfText(file);
  if (extension === "docx") return extractDocxText(file);
  if (["xls", "xlsx"].includes(extension)) return extractSpreadsheetText(file);
  throw new Error("Unsupported file format.");
}

async function extractPdfText(file) {
  const pdfjs = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }
  return pages.join("\n\n");
}

async function extractDocxText(file) {
  await loadScript("https://cdn.jsdelivr.net/npm/mammoth@1.9.0/mammoth.browser.min.js", "mammoth");
  const result = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

async function extractSpreadsheetText(file) {
  await loadScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js", "XLSX");
  const workbook = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
  return workbook.SheetNames
    .map((name) => `# Sheet: ${name}\n${window.XLSX.utils.sheet_to_csv(workbook.Sheets[name])}`)
    .join("\n\n");
}

function loadScript(src, globalName) {
  if (window[globalName]) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-library="${globalName}"]`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", () => reject(new Error(`Could not load ${globalName}.`)), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.dataset.library = globalName;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${globalName}. Check your network connection.`));
    document.head.appendChild(script);
  });
}

function appendProjectMaterial(name, text) {
  const textarea = meetingForm.elements.projectMaterials;
  const section = `## Imported file: ${name}\n\n${text}`;
  const combined = [textarea.value.trim(), section].filter(Boolean).join("\n\n");
  textarea.value = combined.slice(0, MATERIAL_TEXT_LIMIT);
  return combined.length > MATERIAL_TEXT_LIMIT;
}

function cleanImportedText(value) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function renderMaterialFiles() {
  materialFileList.innerHTML = materialFiles.length
    ? materialFiles.map((item) => `
        <div class="material-file ${item.status}">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(item.message)}</span>
        </div>
      `).join("")
    : "";
}

function renderActivity(activity) {
  if (!activity.ok) {
    return `
      <article class="activity-item error">
        <strong>${escapeHtml(activity.toolName || "Tool error")}</strong>
        ${activity.query ? `<p>${escapeHtml(activity.query)}</p>` : ""}
        <p>${escapeHtml(activity.error || "Unknown error")}</p>
      </article>
    `;
  }
  const heading = `${activity.agentId} - ${activity.toolName}`;
  if (activity.status === "approval_required") {
    return `
      <article class="activity-item pending">
        <strong>${escapeHtml(heading)}</strong>
        <p>${escapeHtml(activity.query)}</p>
        <button
          class="ghost-button approve-search"
          data-agent-id="${escapeHtml(activity.agentId)}"
          data-automation-key="${escapeHtml(activity.automationKey)}"
          data-query="${escapeHtml(activity.query)}"
        >Approve search</button>
      </article>
    `;
  }
  const summary = summarizeToolResult(activity);
  return `
    <article class="activity-item">
      <div class="activity-title">
        <strong>${escapeHtml(heading)}</strong>
        <span>auto</span>
      </div>
      <p>${escapeHtml(summary)}</p>
      <details>
        <summary>View result</summary>
        <div class="activity-result">${renderToolResult(activity.result)}</div>
      </details>
    </article>
  `;
}

function summarizeToolResult(activity) {
  if (activity.toolId === "read_project_file") return "Project context loaded for the squad.";
  if (activity.toolId === "write_artifact") return "Current brief artifact refreshed.";
  if (activity.toolId === "update_task") {
    const count = Array.isArray(activity.result) ? activity.result.length : 0;
    return `${count} action ${count === 1 ? "item" : "items"} prepared.`;
  }
  if (activity.toolId === "web_search") {
    const count = Array.isArray(activity.result) ? activity.result.length : 0;
    return `${count} web research ${count === 1 ? "source" : "sources"} added to shared context.`;
  }
  return "Completed.";
}

function renderToolResult(result) {
  if (Array.isArray(result)) {
    return `<ul>${result.map((item) => {
      if (item.url) {
        return `<li><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title || item.url)}</a>${item.snippet ? `<p>${escapeHtml(item.snippet)}</p>` : ""}</li>`;
      }
      return `<li>${renderMarkdown(item.title || String(item))}</li>`;
    }).join("")}</ul>`;
  }
  return `<div class="brief-markdown">${renderMarkdown(String(result || "Completed."))}</div>`;
}

activityList.addEventListener("click", async (event) => {
  const button = event.target.closest(".approve-search");
  if (!button) return;
  button.disabled = true;
  button.textContent = "Searching...";
  try {
    const response = await postJson("/api/tools/execute", {
      toolId: "web_search",
      agentId: button.dataset.agentId,
      source: "automatic",
      automationKey: button.dataset.automationKey,
      payload: {
        query: button.dataset.query,
        approved: true
      }
    });
    addToolActivities([response]);
    addSystemMessage("Approved web research is complete. The sources were added to the squad's shared context for the next turn.", "Research");
  } catch (error) {
    button.disabled = false;
    button.textContent = "Retry search";
    addSystemMessage(error.message || "Web research failed.", "Tool Error");
  }
});

function appendResearchContext(activity) {
  if (!meeting || !Array.isArray(activity.result)) return;
  const section = [
    `Research query: ${activity.query}`,
    ...activity.result.map((item, index) => `${index + 1}. ${item.title}\nSource: ${item.url}\nSummary: ${item.snippet || "No snippet available."}`)
  ].join("\n\n");
  meeting.researchContext = [meeting.researchContext, section]
    .filter(Boolean)
    .join("\n\n")
    .slice(-6000);
}

function repairMarkdown(source) {
  let repaired = String(source).replaceAll("\uFF0A", "*");
  const markers = [...repaired.matchAll(/\*\*/g)];
  if (markers.length % 2 === 0) return repaired;

  const openingIndex = markers.at(-1).index;
  const contentStart = openingIndex + 2;
  const tail = repaired.slice(contentStart);
  const separator = tail.search(/\s-\s/);

  if (separator === -1) return `${repaired}**`;
  const separatorEnd = contentStart + separator + 3;
  return `${repaired.slice(0, contentStart + separator)}**: ${repaired.slice(separatorEnd)}`;
}

function protectStrongMarkdown(source) {
  const values = [];
  const markdown = source.replace(/\*\*([^\n]+?)\*\*/g, (_, value) => {
    const token = `SQUADSTRONGTOKEN${values.length}END`;
    values.push(value);
    return token;
  });
  return { markdown, values };
}

function restoreStrongHtml(html, values) {
  return values.reduce((result, value, index) => {
    return result.replaceAll(`SQUADSTRONGTOKEN${index}END`, `<strong>${escapeHtml(value)}</strong>`);
  }, html);
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
