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
let usageByAgent = {};
let isRunningMeeting = false;
let isPaused = false;
let resumeAutomaticRun = false;
let activeStreamController = null;
let pausedStreamRequest = null;
let streamEpoch = 0;
let abortReason = "";
let isDrainingUserQueue = false;
let pendingUserMessages = [];
let activeUserBatch = [];
let mergeQueuedInterventions = false;
let deferredStreamRequest = null;
let currentBrief = {};
let availableSkills = [];
let availableTools = [];
let toolActivities = [];
let backgroundTasks = [];
let workItems = [];
let squadCapabilities = [];
let inboxItems = [];
let materialFiles = [];
let traceEvents = [];

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
const skillCount = document.querySelector("#skillCount");
const outputs = document.querySelector("#outputs");
const activityCount = document.querySelector("#activityCount");
const activityList = document.querySelector("#activityList");
const backgroundTaskCount = document.querySelector("#backgroundTaskCount");
const backgroundTaskList = document.querySelector("#backgroundTaskList");
const workItemCount = document.querySelector("#workItemCount");
const workItemList = document.querySelector("#workItemList");
const usageBreakdown = document.querySelector("#usageBreakdown");
const traceCount = document.querySelector("#traceCount");
const traceList = document.querySelector("#traceList");
const inboxCount = document.querySelector("#inboxCount");
const inboxList = document.querySelector("#inboxList");
const agentWorkspaceList = document.querySelector("#agentWorkspaceList");
const sharedWorkspaceSummary = document.querySelector("#sharedWorkspaceSummary");
const toolRegistry = document.querySelector("#toolRegistry");
const toolCount = document.querySelector("#toolCount");
const materialFileInput = document.querySelector("#materialFileInput");
const materialFileButton = document.querySelector("#materialFileButton");
const materialFileList = document.querySelector("#materialFileList");
const roomTitle = document.querySelector("#roomTitle");
const stageBadge = document.querySelector("#stageBadge");
const statusLine = document.querySelector("#statusLine");
const usageLine = document.querySelector("#usageLine");
const autoResearchToggle = document.querySelector("#autoResearchToggle");
const explorationModeToggle = document.querySelector("#explorationModeToggle");

meetingForm.elements.apiBase.value = apiBase;
renderSquad();
renderSkills();
renderTools();
renderOutputs({});
renderActivities();
renderBackgroundTasks();
renderWorkItems();
renderWorkspace();
renderUsageBreakdown();
renderTrace();
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
    autoWebResearch: form.get("autoWebResearch") === "on",
    explorationMode: form.get("explorationMode") === "on"
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
  usageByAgent = {};
  currentBrief = {};
  toolActivities = [];
  backgroundTasks = [];
  workItems = [];
  inboxItems = [];
  traceEvents = [];
  pendingUserMessages = [];
  activeUserBatch = [];
  mergeQueuedInterventions = false;
  deferredStreamRequest = null;
  materialFiles = [];
  isPaused = false;
  resumeAutomaticRun = false;
  pausedStreamRequest = null;
  renderPauseState();
  renderMaterialFiles();
  renderBackgroundTasks();
  renderWorkItems();
  renderWorkspace();
  renderUsageBreakdown();
  renderTrace();
  renderInterruptionQueue();
  setupView.classList.remove("hidden");
  roomView.classList.add("hidden");
});

interruptNowButton.addEventListener("click", async () => {
  await interruptForQueuedMessages();
});

pauseButton.addEventListener("click", async () => {
  if (!isPaused) {
    pauseMeeting();
    return;
  }
  await resumeMeetingFromPause();
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

explorationModeToggle.addEventListener("change", () => {
  if (!meeting) return;
  meeting.explorationMode = explorationModeToggle.checked;
  meetingForm.elements.explorationMode.checked = explorationModeToggle.checked;
  addSystemMessage(
    explorationModeToggle.checked
      ? "Exploration mode is enabled. Opportunity research may use up to four background searches per stage."
      : "Exploration mode is disabled. Opportunity research is limited to two background searches per stage.",
    "Workspace"
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
  await runNextStageCommand();
});

runMeetingButton.addEventListener("click", async () => {
  await runMeeting();
});

summaryButton.addEventListener("click", async () => {
  await runSummaryCommand();
});

messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = messageInput.value.trim();
  if (!message) return;
  messageInput.value = "";
  if (await handleChatCommand(message)) return;
  pendingUserMessages.push({ id: crypto.randomUUID(), message });
  renderInterruptionQueue();
  if (isPaused) return;
  await drainUserQueue();
  await resumeDeferredStreamRequest();
  await resumePendingAutomaticRun();
});

async function startMeeting() {
  streamEpoch += 1;
  setupView.classList.add("hidden");
  roomView.classList.remove("hidden");
  roomTitle.textContent = meeting.topic || "Squad Room";
  history = [];
  stageIndex = 0;
  totalTokens = 0;
  usageByAgent = {};
  currentBrief = {};
  toolActivities = [];
  backgroundTasks = [];
  workItems = [];
  inboxItems = [];
  traceEvents = [];
  pendingUserMessages = [];
  activeUserBatch = [];
  mergeQueuedInterventions = false;
  deferredStreamRequest = null;
  isPaused = false;
  resumeAutomaticRun = false;
  pausedStreamRequest = null;
  renderPauseState();
  autoResearchToggle.checked = Boolean(meeting.autoWebResearch);
  explorationModeToggle.checked = Boolean(meeting.explorationMode);
  renderMessages();
  renderOutputs({});
  renderActivities();
  renderBackgroundTasks();
  renderWorkItems();
  renderWorkspace();
  renderUsageBreakdown();
  renderTrace();
  renderInterruptionQueue();

  await withBusy(meetingForm.querySelector("button"), "Opening", async () => {
    await postStream("/api/meeting/start/stream", meeting);
  });
  await drainUserQueue();
  await resumeDeferredStreamRequest();
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

async function handleChatCommand(rawMessage) {
  const intent = parseChatIntent(rawMessage);
  const command = intent.command;
  if (!command) return false;

  if (command === "help") {
    addSystemMessage("Chat controls: stop/pause, resume, interrupt, retry, next, run, summary, clear queue, help. Prefix with / if you want to be explicit.", "Command");
    return true;
  }
  if (command === "pause") {
    pauseMeeting();
    return true;
  }
  if (command === "resume") {
    if (!isPaused) {
      addSystemMessage("Meeting is not paused.", "Command");
      return true;
    }
    await resumeMeetingFromPause();
    return true;
  }
  if (command === "interrupt") {
    if (!activeStreamController) {
      addSystemMessage("No active teammate response to interrupt.", "Command");
      return true;
    }
    if (!getWaitingUserMessages().length) {
      pauseMeeting();
      return true;
    }
    await interruptForQueuedMessages();
    return true;
  }
  if (command === "retry") {
    await drainUserQueue();
    await resumeDeferredStreamRequest();
    await resumePendingAutomaticRun();
    return true;
  }
  if (command === "next") {
    await runNextStageCommand();
    return true;
  }
  if (command === "run") {
    await runMeeting();
    return true;
  }
  if (command === "summary") {
    await runSummaryCommand();
    return true;
  }
  if (command === "clear") {
    const count = pendingUserMessages.length;
    pendingUserMessages = [];
    activeUserBatch = [];
    mergeQueuedInterventions = false;
    renderInterruptionQueue();
    addSystemMessage(`${count} queued ${count === 1 ? "message" : "messages"} cleared.`, "Command");
    return true;
  }
  return false;
}

function parseChatIntent(rawMessage) {
  const value = String(rawMessage || "").trim().toLowerCase();
  if (!value) return { command: "", confidence: "none" };
  const explicit = value.startsWith("/");
  const token = explicit ? value.slice(1).trim().split(/\s+/)[0] : value;
  const exactCommands = new Map([
    ["stop", "pause"],
    ["pause", "pause"],
    ["halt", "pause"],
    ["暂停", "pause"],
    ["停止", "pause"],
    ["resume", "resume"],
    ["continue", "resume"],
    ["继续", "resume"],
    ["恢复", "resume"],
    ["interrupt", "interrupt"],
    ["打断", "interrupt"],
    ["retry", "retry"],
    ["重试", "retry"],
    ["next", "next"],
    ["下一步", "next"],
    ["run", "run"],
    ["继续会议", "run"],
    ["summary", "summary"],
    ["summarize", "summary"],
    ["总结", "summary"],
    ["clear", "clear"],
    ["clear queue", "clear"],
    ["清空队列", "clear"],
    ["help", "help"],
    ["?", "help"]
  ]);
  const exact = exactCommands.get(token);
  if (exact) return { command: exact, confidence: explicit ? "explicit" : "high" };
  if (explicit) return { command: "", confidence: "none" };

  const normalized = value.replace(/[，。！？!?.、\s]/g, "");
  if (looksLikeDiscussionContent(normalized)) return { command: "", confidence: "none" };
  const semantic = parseSemanticControlIntent(normalized);
  return semantic ? { command: semantic, confidence: "high" } : { command: "", confidence: "none" };
}

function looksLikeDiscussionContent(text) {
  if (text.length > 18) return true;
  return [
    "功能", "逻辑", "设计", "问题", "需求", "实现", "策略", "方案", "机制", "按钮",
    "怎么", "如何", "为什么", "原因", "分析", "讨论", "优化", "开发", "代码",
    "stoploss", "停止使用", "暂停功能"
  ].some((keyword) => text.includes(keyword));
}

function parseSemanticControlIntent(text) {
  const commandPatterns = [
    ["pause", ["你先停", "先停", "停一下", "停一停", "先别说", "别说了", "暂停一下", "暂停一下会议", "暂停会议", "会议暂停", "先暂停", "等一下", "等一等", "等等", "先等"]],
    ["resume", ["继续吧", "继续说", "接着说", "接着来", "可以继续", "恢复会议", "继续会议", "开始继续"]],
    ["summary", ["总结一下", "帮我总结", "先总结", "生成总结", "做个总结"]],
    ["next", ["下一阶段", "进入下一阶段", "下一步吧", "推进到下一步", "继续下一步"]],
    ["run", ["跑完整会议", "继续跑", "自动推进", "跑完会议"]],
    ["retry", ["再试一下", "重新发送", "重试一下"]],
    ["clear", ["清空队列", "清掉队列", "取消排队"]]
  ];
  for (const [command, patterns] of commandPatterns) {
    if (patterns.some((pattern) => text === pattern || text.includes(pattern))) return command;
  }
  return "";
}

async function interruptForQueuedMessages() {
  if (!getWaitingUserMessages().length) return;
  if (!activeStreamController) {
    await drainUserQueue();
    await resumeDeferredStreamRequest();
    await resumePendingAutomaticRun();
    return;
  }
  mergeQueuedInterventions = true;
  abortReason = "user_interruption";
  activeStreamController.abort();
}

async function resumeMeetingFromPause() {
  const shouldResumeAutomaticRun = resumeAutomaticRun;
  const request = pausedStreamRequest;
  isPaused = false;
  resumeAutomaticRun = false;
  pausedStreamRequest = null;
  renderPauseState();
  addSystemMessage("Meeting resumed.", "Control");
  const queueCleared = await drainUserQueue({ merge: true });
  if (!queueCleared) {
    resumeAutomaticRun = shouldResumeAutomaticRun;
    if (request && !shouldResumeAutomaticRun) deferredStreamRequest = request;
    return;
  }
  if (shouldResumeAutomaticRun) {
    await resumeAutomaticMeeting();
    return;
  }
  if (request) {
    try {
      await postStream(request.path, buildResumePayload(request.payload, history));
      await drainUserQueue();
    } catch (error) {
      if (error.name !== "AbortError") addSystemMessage(error.message || "Something went wrong.", "Error");
    }
  }
  await resumeDeferredStreamRequest();
}

async function runNextStageCommand() {
  if (isPaused || activeStreamController) return;
  await withBusy(continueButton, "Thinking", async () => {
    await postStream("/api/meeting/continue/stream", { meeting, history, stageIndex });
  });
  await drainUserQueue();
  await resumeDeferredStreamRequest();
}

async function runSummaryCommand() {
  if (isPaused || activeStreamController) return;
  await withBusy(summaryButton, "Summarizing", async () => {
    await postStream("/api/meeting/summary/stream", { meeting, history });
  });
  await drainUserQueue();
  await resumeDeferredStreamRequest();
}

async function drainUserQueue({ merge = false } = {}) {
  if (isDrainingUserQueue || isPaused || activeStreamController) return pendingUserMessages.length === 0;
  isDrainingUserQueue = true;
  try {
    while (!isPaused && !activeStreamController && pendingUserMessages.length) {
      const shouldMerge = merge || mergeQueuedInterventions;
      const queued = shouldMerge ? [...pendingUserMessages] : [pendingUserMessages[0]];
      activeUserBatch = queued;
      const message = queued.map((item) => item.message).join("\n\n");
      renderInterruptionQueue();
      const completed = await withBusy(messageForm.querySelector("button"), "Sending", async () => {
        return postStream("/api/meeting/message/stream", { meeting, history, stageIndex, message });
      });
      if (completed !== true) {
        if (completed === false && !isPaused && mergeQueuedInterventions) continue;
        break;
      }
      const sentIds = new Set(queued.map((item) => item.id));
      pendingUserMessages = pendingUserMessages.filter((item) => !sentIds.has(item.id));
      activeUserBatch = [];
      mergeQueuedInterventions = false;
      merge = false;
      renderInterruptionQueue();
    }
  } finally {
    activeUserBatch = [];
    isDrainingUserQueue = false;
    renderInterruptionQueue();
  }
  return pendingUserMessages.length === 0;
}

function renderInterruptionQueue() {
  const count = pendingUserMessages.length;
  const waitingCount = getWaitingUserMessages().length;
  interruptionBar.classList.toggle("hidden", count === 0);
  interruptionCount.textContent = isPaused
    ? `${count} ${count === 1 ? "note" : "notes"} queued for resume`
    : activeUserBatch.length
      ? `${count} ${count === 1 ? "message" : "messages"} · processing`
      : `${count} pending ${count === 1 ? "message" : "messages"}`;
  interruptNowButton.hidden = isPaused;
  interruptNowButton.textContent = activeStreamController ? "Interrupt now" : "Retry queued";
  interruptNowButton.disabled = isPaused || waitingCount === 0;
}

function getWaitingUserMessages() {
  const activeIds = new Set(activeUserBatch.map((item) => item.id));
  return pendingUserMessages.filter((item) => !activeIds.has(item.id));
}

function pauseMeeting({ announce = true } = {}) {
  if (isPaused && !activeStreamController) return;
  resumeAutomaticRun = isRunningMeeting;
  isPaused = true;
  abortReason = "pause";
  activeStreamController?.abort();
  renderPauseState();
  if (announce) addSystemMessage("Meeting paused. Partial output is preserved. Add context or instructions, then resume when ready.", "Control");
}

function renderPauseState() {
  pauseButton.textContent = isPaused ? "Resume" : "Pause";
  pauseButton.classList.toggle("active", isPaused);
  runMeetingButton.disabled = isPaused;
  continueButton.disabled = isPaused;
  summaryButton.disabled = isPaused;
  messageInput.disabled = false;
  messageForm.querySelector("button").disabled = false;
  renderInterruptionQueue();
}

async function resumeAutomaticMeeting() {
  while (isRunningMeeting) await new Promise((resolve) => setTimeout(resolve, 0));
  await runMeeting();
}

async function resumeDeferredStreamRequest() {
  if (!deferredStreamRequest || pendingUserMessages.length || isPaused || activeStreamController || isRunningMeeting) return;
  const request = deferredStreamRequest;
  deferredStreamRequest = null;
  let completed = false;
  try {
    completed = await postStream(request.path, buildResumePayload(request.payload, history));
  } catch (error) {
    if (error.name !== "AbortError") {
      deferredStreamRequest = request;
      addSystemMessage(error.message || "Could not resume the interrupted request.", "Error");
    }
    return;
  }
  if (completed) return;
  await drainUserQueue();
  await resumeDeferredStreamRequest();
}

async function resumePendingAutomaticRun() {
  if (!resumeAutomaticRun || pendingUserMessages.length || isPaused || activeStreamController || isRunningMeeting) return;
  resumeAutomaticRun = false;
  await resumeAutomaticMeeting();
}

function applyResult(result) {
  stageIndex = result.stageIndex ?? stageIndex;
  if (result.stage) stageBadge.textContent = result.stage;
  if (Array.isArray(result.messages)) history = [...history, ...result.messages];
  applyUsage(result.usage);
  renderMessages();
  currentBrief = result.outputs || currentBrief;
  renderOutputs(currentBrief);
  renderWorkspace();
  addToolActivities(result.toolActivities);
}

function applyUsage(usage = {}) {
  totalTokens += usage.totalTokens || 0;
  for (const [agentId, agentUsage] of Object.entries(usage.byAgent || {})) {
    usageByAgent[agentId] ||= { totalTokens: 0 };
    usageByAgent[agentId].totalTokens += agentUsage.totalTokens || 0;
  }
  usageLine.textContent = `${totalTokens.toLocaleString()} tokens`;
  renderUsageBreakdown();
}

function renderSquad() {
  const capabilities = new Map(squadCapabilities.map((member) => [member.id, member]));
  squadList.innerHTML = members
    .map((member) => {
      const capability = capabilities.get(member.id) || {};
      const skillNames = (capability.skills || []).map((skill) => skill.name);
      const toolNames = (capability.tools || []).map((tool) => tool.name);
      return `
      <article class="member">
        <span class="member-dot" style="background:${member.color}"></span>
        <div>
          <strong>${escapeHtml(member.name)}</strong>
          <span>${escapeHtml(member.role)}</span>
          <details class="member-capabilities">
            <summary>${skillNames.length} skill · ${toolNames.length} tools</summary>
            <p><b>Skill</b> ${escapeHtml(skillNames.join(", ") || "General reasoning")}</p>
            <p><b>Tools</b> ${escapeHtml(toolNames.join(", ") || "No assigned tools")}</p>
          </details>
        </div>
      </article>
    `;
    })
    .join("");
}

function renderMessages() {
  messageList.innerHTML = history.map((message) => renderMessageHtml(message)).join("");
  messageList.scrollTop = messageList.scrollHeight;
}

function renderMessageHtml(message) {
  const kind = message.kind || "agent";
  const interrupted = message.interrupted ? " interrupted" : "";
  const discussionLabel = formatDiscussionLabel(message.discussionMeta);
  return `
    <article class="message ${kind}${interrupted}" data-message-id="${escapeHtml(message.id)}">
      <div class="message-head">
        <span>${escapeHtml(message.speakerName || message.speakerId)}</span>
        <span class="message-stage">${message.interrupted ? '<span class="message-interrupted">Interrupted</span>' : ""}${escapeHtml(message.stage || "")}</span>
      </div>
      ${discussionLabel ? `<div class="discussion-label">${escapeHtml(discussionLabel)}</div>` : ""}
      <div class="markdown-body">${renderMarkdown(message.content || "")}</div>
    </article>
  `;
}

function formatDiscussionLabel(meta = {}) {
  if (!meta?.contributionType || meta.contributionType === "Core turn") return "";
  const reply = meta.respondingTo ? ` · responding to ${meta.respondingTo}` : "";
  return `${meta.contributionType}${reply}`;
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
    squadCapabilities = config.squad || [];
    renderSquad();
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
        return true;
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
    return true;
  } catch (error) {
    if (error.name === "AbortError" && requestEpoch === streamEpoch) {
      const currentAbortReason = abortReason;
      const isUserResponse = path === "/api/meeting/message/stream";
      stageIndex = previousStageIndex;
      stageBadge.textContent = previousStageLabel;
      currentBrief = previousBrief;
      if (currentAbortReason === "pause" && !isUserResponse) {
        history = history
          .filter((message) => previousMessageIds.has(message.id) || (message.kind !== "user" && String(message.content || "").trim()))
          .map((message) => {
            if (!previousMessageIds.has(message.id) && message.streaming) {
              return { ...message, interrupted: true, streaming: false };
            }
            return message;
          });
      } else {
        history = history.filter((message) => previousMessageIds.has(message.id));
      }
      renderMessages();
      renderOutputs(currentBrief);
      pausedStreamRequest = currentAbortReason === "pause" && !isUserResponse
        ? { path, payload: buildResumePayload(payload, history) }
        : null;
      if (currentAbortReason === "user_interruption" && !isUserResponse && !isRunningMeeting) {
        deferredStreamRequest = { path, payload: buildResumePayload(payload, history) };
      }
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

function buildResumePayload(payload, resumeHistory) {
  if (!Object.hasOwn(payload, "history")) return payload;
  return { ...payload, history: resumeHistory };
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
    addTraceEvent("stage", `Stage started: ${data.stage || stageBadge.textContent}`, { stageIndex });
    return;
  }
  if (event.type === "message_start") {
    addTraceEvent("agent", `${data.message?.speakerName || data.message?.speakerId || "Agent"} started`, { stage: data.message?.stage });
    return upsertMessage({ ...data.message, streaming: true });
  }
  if (event.type === "token") return appendToken(data.id, data.token || "");
  if (event.type === "message_done") {
    addTraceEvent("agent", `${data.message?.speakerName || data.message?.speakerId || "Agent"} finished`, { tokens: data.usage?.totalTokens || 0 });
    return finalizeMessage({ ...data.message, streaming: false });
  }
  if (event.type === "brief") {
    currentBrief = data.outputs || {};
    addTraceEvent("brief", "Structured brief refreshed", {
      items: ["proposal", "actions", "risks", "questions"].reduce((count, key) => count + (Array.isArray(currentBrief[key]) ? currentBrief[key].length : 0), 0)
    });
    renderOutputs(currentBrief);
    renderWorkspace();
    return;
  }
  if (event.type === "tool_activity") {
    addTraceEvent("tool", `${data.agentId || "agent"} ran ${data.toolName || data.toolId || "tool"}`, { status: data.status || "completed" });
    addToolActivities([data]);
    return;
  }
  if (event.type === "background_task") {
    addTraceEvent("background", `${data.ownerAgent || "agent"} ${data.status || "queued"}: ${data.name || "task"}`, { query: data.query || data.message || "" });
    addBackgroundTask(data);
    return;
  }
  if (event.type === "inbox_item") {
    addTraceEvent("inbox", `${data.ownerAgent || "agent"} added a discovery`, { impact: data.impact || "note" });
    addInboxItem(data);
    return;
  }
  if (event.type === "done") {
    stageIndex = data.stageIndex ?? stageIndex;
    if (data.stage) stageBadge.textContent = data.stage;
    applyUsage(data.usage);
    currentBrief = data.outputs || currentBrief;
    renderOutputs(currentBrief);
    renderWorkspace();
    addToolActivities(data.toolActivities);
    addStageProgressMessage(data.stage);
    addTraceEvent("done", `${data.stage || "Stage"} completed`, { tokens: data.usage?.totalTokens || 0 });
    return;
  }
  if (event.type === "error") {
    addTraceEvent("error", data.message || "Stream failed.", {});
    throw new Error(data.message || "Stream failed.");
  }
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
    return await task();
  } catch (error) {
    if (error.name !== "AbortError") addSystemMessage(error.message || "Something went wrong.", "Error");
    return null;
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
  skillCount.textContent = String(availableSkills.length);
  skillList.innerHTML = availableSkills.length
    ? availableSkills.map((skill) => `<span class="skill-chip">${escapeHtml(skill.name)}</span>`).join("")
    : '<span class="muted-line">Loading...</span>';
}

function renderTools() {
  toolCount.textContent = String(availableTools.length);
  toolRegistry.innerHTML = availableTools.length
    ? availableTools.map((tool) => `
        <div class="tool-registry-item">
          <strong>${escapeHtml(tool.name)}</strong>
          <span>${tool.approval === "user" ? "Agent-run; may ask approval" : "Agent-run automatically"}</span>
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
    if (activity.toolId === "update_task" && activity.status === "completed") addWorkItems(activity.result);
  }
  toolActivities = toolActivities.slice(0, 20);
  renderActivities();
  renderWorkspace();
  renderUsageBreakdown();
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
  renderWorkspace();
}

function renderBackgroundTasks() {
  backgroundTaskCount.textContent = String(backgroundTasks.length);
  backgroundTaskList.innerHTML = backgroundTasks.length
    ? backgroundTasks.map((task) => `
        <div class="background-task ${escapeHtml(task.status || "queued")}">
          <div>
            <strong>${escapeHtml(task.ownerAgent || "agent")} - ${escapeHtml(task.name || "Background task")}</strong>
            <span>${escapeHtml(task.query || task.message || "")}</span>
            ${task.budget ? `<span>${escapeHtml(formatExplorationBudget(task))}</span>` : ""}
          </div>
          <b>${escapeHtml(formatTaskStatus(task.status))}</b>
        </div>
      `).join("")
    : '<p class="muted-line">No background tasks yet.</p>';
}

function addWorkItems(items = []) {
  for (const item of items || []) {
    if (!item?.id) continue;
    const existingIndex = workItems.findIndex((workItem) => workItem.id === item.id);
    if (existingIndex >= 0) workItems.splice(existingIndex, 1);
    workItems.unshift(item);
  }
  workItems = workItems.slice(0, 16);
  renderWorkItems();
  renderWorkspace();
}

function renderWorkItems() {
  workItemCount.textContent = String(workItems.length);
  workItemList.innerHTML = workItems.length
    ? workItems.map((item) => `
        <article class="work-item">
          <div>
            <strong>${escapeHtml(item.title || "Untitled task")}</strong>
            <span>${escapeHtml(item.ownerAgent || "captain")} · ${escapeHtml(item.deliverable || "action")}</span>
          </div>
          <div class="work-item-actions">
            <b>${escapeHtml(formatTaskStatus(item.status))}</b>
            <button type="button" class="icon-text-button task-toggle" data-task-id="${escapeHtml(item.id)}">${item.status === "running" ? "Pause" : "Start"}</button>
            <button type="button" class="icon-text-button task-archive" data-task-id="${escapeHtml(item.id)}">Archive</button>
          </div>
        </article>
      `).join("")
    : '<p class="muted-line">Tasks appear after the squad turns decisions into action.</p>';
}

function addInboxItem(item) {
  if (!item?.id) return;
  const normalized = normalizeInboxItem(item);
  const existingIndex = inboxItems.findIndex((entry) => entry.groupKey === normalized.groupKey);
  if (existingIndex >= 0) {
    const merged = mergeInboxItems(inboxItems[existingIndex], normalized);
    inboxItems.splice(existingIndex, 1);
    inboxItems.unshift(merged);
  } else {
    inboxItems.unshift(normalized);
  }
  inboxItems = inboxItems.slice(0, 12);
  renderWorkspace();
}

function renderWorkspace() {
  const visibleInboxItems = inboxItems.filter((item) => item.status !== "archived");
  inboxCount.textContent = String(visibleInboxItems.length);
  inboxList.innerHTML = visibleInboxItems.length
    ? visibleInboxItems.map((item) => renderInboxItem(item)).join("")
    : '<p class="muted-line">Background discoveries will arrive here without interrupting the discussion.</p>';
  agentWorkspaceList.innerHTML = members.map((member) => {
    const assigned = workItems.filter((item) => item.ownerAgent === member.id && item.status !== "archived").length;
    const discoveries = visibleInboxItems.filter((item) => item.ownerAgent === member.id).length;
    const background = backgroundTasks.filter((item) => item.ownerAgent === member.id && ["queued", "running", "approval_required"].includes(item.status)).length;
    return `
      <div class="agent-workspace">
        <strong>${escapeHtml(member.name)}</strong>
        <span>${assigned} assigned · ${background} active · ${discoveries} discoveries</span>
      </div>
    `;
  }).join("");
  const artifacts = toolActivities.filter((activity) => activity.toolId === "write_artifact" && activity.status === "completed").length;
  const decisions = Array.isArray(currentBrief.proposal) ? currentBrief.proposal.length : 0;
  const questions = Array.isArray(currentBrief.questions) ? currentBrief.questions.length : 0;
  sharedWorkspaceSummary.innerHTML = `
    <div><b>Mission</b><span>${escapeHtml(meeting?.goal || "Open a room to create the shared mission.")}</span></div>
    <div><b>Decisions</b><span>${decisions} current direction items</span></div>
    <div><b>Open questions</b><span>${questions} unresolved items</span></div>
    <div><b>Shared artifacts</b><span>${artifacts} brief artifacts</span></div>
    <div><b>Activity log</b><span>${toolActivities.length} visible tool events</span></div>
  `;
}

function normalizeInboxItem(item) {
  const budget = item.budget || {};
  const query = String(item.query || extractInboxQuery(item.summary) || "").trim();
  const callIndex = Number(budget.callIndex || item.callIndex || 1);
  const callLimit = Number(budget.callLimit || item.callLimit || 1);
  const groupKey = item.groupKey || budget.groupKey || [
    item.stageCreated || "stage",
    item.ownerAgent || "agent",
    item.artifactType || "note",
    budget.type || "task",
    budget.depth || "standard",
    Number.isFinite(callLimit) ? callLimit : 1
  ].join(":");
  const isResearchNote = item.artifactType === "research-note" || /completed opportunity research/i.test(item.title || "");

  return {
    ...item,
    groupKey,
    title: isResearchNote ? `${getMemberName(item.ownerAgent)} research update` : item.title || `${getMemberName(item.ownerAgent)} update`,
    sourceCount: Number.isFinite(Number(item.sourceCount))
      ? Number(item.sourceCount)
      : extractSourceCount(item.summary),
    queries: query ? [query] : [],
    callIndexes: Number.isFinite(callIndex) ? [callIndex] : [],
    completedCalls: 1,
    callLimit: Number.isFinite(callLimit) ? callLimit : 1,
    rawIds: [item.id],
    updatedAt: item.createdAt || new Date().toISOString()
  };
}

function mergeInboxItems(existing, next) {
  const rawIds = uniqueStrings([...(existing.rawIds || []), ...(next.rawIds || [])]);
  const isDuplicate = (existing.rawIds || []).some((id) => (next.rawIds || []).includes(id));
  const callIndexes = uniqueNumbers([...(existing.callIndexes || []), ...(next.callIndexes || [])]);
  const queries = uniqueStrings([...(existing.queries || []), ...(next.queries || [])]);
  return {
    ...existing,
    ...next,
    title: existing.title || next.title,
    summary: next.summary || existing.summary,
    queries,
    callIndexes,
    completedCalls: callIndexes.length || Math.max(existing.completedCalls || 0, next.completedCalls || 0, 1),
    callLimit: Math.max(existing.callLimit || 1, next.callLimit || 1),
    sourceCount: (existing.sourceCount || 0) + (isDuplicate ? 0 : (next.sourceCount || 0)),
    rawIds,
    status: existing.status === "archived" ? existing.status : next.status || existing.status,
    updatedAt: next.updatedAt || next.createdAt || existing.updatedAt
  };
}

function renderInboxItem(item) {
  const sourceCount = item.sourceCount || 0;
  const searchCount = item.completedCalls || item.queries?.length || 1;
  const sourceLabel = sourceCount
    ? `${sourceCount} ${sourceCount === 1 ? "source" : "sources"} collected`
    : "No sources collected yet";
  const scope = searchCount > 1
    ? `across ${searchCount} searches`
    : item.queries?.[0]
      ? `for "${truncateForUi(item.queries[0], 72)}"`
      : "";
  const queryList = item.queries?.length
    ? `
      <details class="inbox-details">
        <summary>${item.queries.length === 1 ? "Search query" : "Search queries"}</summary>
        <ul>${item.queries.map((query) => `<li>${escapeHtml(query)}</li>`).join("")}</ul>
      </details>
    `
    : "";

  return `
    <article class="inbox-item ${escapeHtml(item.impact || "useful")}">
      <div class="inbox-main">
        <div class="inbox-title-row">
          <strong>${escapeHtml(item.title || `${getMemberName(item.ownerAgent)} update`)}</strong>
          <b class="inbox-badge">${escapeHtml(formatInboxImpact(item.impact))}</b>
        </div>
        <span>${escapeHtml([sourceLabel, scope].filter(Boolean).join(" "))}</span>
        <span>${escapeHtml(formatExplorationBudget(item))}</span>
        ${queryList}
      </div>
    </article>
  `;
}

function extractInboxQuery(summary = "") {
  const match = String(summary).match(/\bfor:\s*([\s\S]+)$/i);
  return match ? match[1].trim() : "";
}

function extractSourceCount(summary = "") {
  const match = String(summary).match(/(\d+)\s+sources?/i);
  return match ? Number(match[1]) : 0;
}

function uniqueStrings(items) {
  return [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))];
}

function uniqueNumbers(items) {
  return [...new Set(items.map((item) => Number(item)).filter(Number.isFinite))].sort((a, b) => a - b);
}

function getMemberName(id) {
  return members.find((member) => member.id === id)?.name || String(id || "Agent");
}

function formatInboxImpact(impact) {
  if (impact === "decision-changing") return "Decision";
  if (impact === "useful") return "Useful";
  return "Note";
}

function formatExplorationBudget(item) {
  const budget = item.budget || item || {};
  const depth = budget.depth || item.budgetDepth || "";
  const done = item.completedCalls || (Number.isFinite(Number(budget.callIndex)) ? Number(budget.callIndex) : 0);
  const limit = item.callLimit || (Number.isFinite(Number(budget.callLimit)) ? Number(budget.callLimit) : 0);
  const label = depth === "deep"
    ? "Exploration mode"
    : depth === "bounded"
      ? "Standard research"
      : "Research";
  if (done && limit) return `${label} - ${Math.min(done, limit)}/${limit} searches complete`;
  if (limit) return `${label} - up to ${limit} searches`;
  return label;
}

function truncateForUi(value, max) {
  const text = String(value || "");
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function renderUsageBreakdown() {
  const agentRows = Object.entries(usageByAgent)
    .sort(([, left], [, right]) => (right.totalTokens || 0) - (left.totalTokens || 0))
    .map(([agentId, usage]) => `<li><span>${escapeHtml(agentId)}</span><b>${(usage.totalTokens || 0).toLocaleString()} tokens</b></li>`)
    .join("");
  const toolCounts = new Map();
  for (const activity of toolActivities) {
    if (activity.status !== "completed") continue;
    toolCounts.set(activity.toolName, (toolCounts.get(activity.toolName) || 0) + 1);
  }
  const toolRows = [...toolCounts.entries()]
    .map(([name, count]) => `<li><span>${escapeHtml(name)}</span><b>${count} run${count === 1 ? "" : "s"}</b></li>`)
    .join("");
  usageBreakdown.innerHTML = `
    <h4>Agents</h4>
    <ul>${agentRows || "<li><span>No model usage yet.</span></li>"}</ul>
    <h4>Tools</h4>
    <ul>${toolRows || "<li><span>No tool usage yet.</span></li>"}</ul>
  `;
}

function addTraceEvent(type, summary, meta = {}) {
  traceEvents.unshift({
    id: crypto.randomUUID(),
    type,
    summary,
    meta,
    at: new Date().toLocaleTimeString()
  });
  traceEvents = traceEvents.slice(0, 80);
  renderTrace();
}

function renderTrace() {
  if (!traceCount || !traceList) return;
  traceCount.textContent = String(traceEvents.length);
  traceList.innerHTML = traceEvents.length
    ? traceEvents.map((event) => `
        <article class="trace-item ${escapeHtml(event.type)}">
          <div>
            <strong>${escapeHtml(event.summary)}</strong>
            <span>${escapeHtml(event.at)} · ${escapeHtml(event.type)}</span>
          </div>
          ${Object.keys(event.meta || {}).length ? `<code>${escapeHtml(JSON.stringify(event.meta))}</code>` : ""}
        </article>
      `).join("")
    : '<p class="muted-line">Run trace events will appear here as the room works.</p>';
}

workItemList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-task-id]");
  if (!button) return;
  const item = workItems.find((workItem) => workItem.id === button.dataset.taskId);
  if (!item) return;
  if (button.classList.contains("task-archive")) item.status = "archived";
  else item.status = item.status === "running" ? "paused" : "running";
  renderWorkItems();
  renderWorkspace();
});

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
  if (activity.toolId === "create_research_plan") return "Research plan prepared for the squad.";
  if (activity.toolId === "create_option_board") return "Option board prepared for comparison.";
  if (activity.toolId === "create_feasibility_checklist") return "Feasibility checklist prepared.";
  if (activity.toolId === "create_risk_register") return "Risk register prepared.";
  if (activity.toolId === "create_decision_matrix") return "Decision matrix prepared.";
  if (activity.toolId === "create_pitch_outline") return "Pitch outline prepared.";
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
  if (result && typeof result === "object" && result.kind === "artifact") {
    const tableCount = Array.isArray(result.data?.tables) ? result.data.tables.length : 0;
    const checklistCount = Array.isArray(result.data?.checklists) ? result.data.checklists.length : 0;
    return `
      <div class="brief-markdown">${renderMarkdown(result.markdown || "")}</div>
      <p class="artifact-meta">${escapeHtml(result.artifactType || "artifact")} · ${tableCount} table${tableCount === 1 ? "" : "s"} · ${checklistCount} checklist item${checklistCount === 1 ? "" : "s"}</p>
    `;
  }
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
