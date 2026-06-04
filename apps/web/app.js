const API_BASE_KEY = "squad-room-api-base";
const LANGUAGE_KEY = "squad-room-language";
const SQUAD_CONFIG_KEY = "squad-room-config";
const defaultApiBase = localStorage.getItem(API_BASE_KEY) || "http://localhost:8787";
const defaultLanguage = localStorage.getItem(LANGUAGE_KEY) || (navigator.language?.toLowerCase().startsWith("zh") ? "zh" : "en");

const translations = {
  en: {
    "nav.subtitle": "Personal AI advisor team",
    "nav.home": "Home",
    "nav.meeting": "Meeting",
    "nav.dashboard": "Dashboard",
    "nav.settings": "Settings",
    "home.eyebrow": "Personal AI meeting room",
    "home.title": "Open a focused room for problems that need discussion.",
    "home.subtitle": "Start with a topic, bring in project material, and let the squad turn a messy idea into decisions, tasks, and a cleaner next move.",
    "home.start": "Start a meeting",
    "home.demo": "Load demo",
    "home.previewNow": "Now",
    "home.previewDecision": "Clarify the real problem before generating ideas.",
    "home.previewNext": "Next",
    "home.previewAction": "Run one stage, inspect the brief, then keep the room moving.",
    "home.previewWatch": "Watch",
    "home.previewRisk": "Separate meeting decisions from diagnostics and configuration.",
    "setup.title": "Create a room",
    "setup.subtitle": "Only the inputs needed to start the discussion live here. Capabilities and diagnostics have their own pages.",
    "setup.topic": "Topic",
    "setup.topicPlaceholder": "Product decision, research question, project plan...",
    "setup.contestType": "Discussion type",
    "setup.goal": "Goal",
    "setup.goalPlaceholder": "Get from rough idea to pitch-ready plan",
    "setup.constraints": "Constraints",
    "setup.constraintsPlaceholder": "Deadline, team size, required deliverables, tools, budget...",
    "setup.materials": "Project materials",
    "setup.materialsPlaceholder": "Paste requirements, criteria, notes, source excerpts, or existing project context...",
    "setup.importFiles": "Import files",
    "setup.openRoom": "Open room",
    "room.eyebrow": "Meeting room",
    "room.pause": "Pause",
    "room.resume": "Resume",
    "room.new": "New",
    "room.interrupt": "Interrupt now",
    "room.composerPlaceholder": "Join the discussion, ask a teammate, or add constraints...",
    "room.send": "Send",
    "room.run": "Run Meeting",
    "room.next": "Next Stage",
    "room.summary": "Summary",
    "brief.title": "Room Brief",
    "brief.subtitle": "Decisions, actions, and watch points",
    "brief.keyBrief": "Key Brief",
    "brief.tasks": "Task Center",
    "brief.research": "Research Updates",
    "brief.direction": "Direction",
    "brief.actions": "Next Actions",
    "brief.risks": "Watch Points",
    "brief.questions": "Open Questions",
    "brief.noBriefTitle": "No brief yet",
    "brief.noBriefText": "Run the meeting and the squad will turn the discussion into a concise decision brief.",
    "brief.now": "Now",
    "brief.next": "Next",
    "brief.watch": "Watch",
    "brief.ask": "Ask",
    "brief.waiting": "Waiting for the first team conclusion.",
    "brief.noAction": "No concrete action yet.",
    "brief.noRisk": "No major watch point yet.",
    "brief.noQuestion": "No open question yet.",
    "dashboard.eyebrow": "Operations",
    "dashboard.title": "Dashboard",
    "dashboard.subtitle": "A quieter place for workspace state, background work, tool runs, and trace details.",
    "dashboard.sharedWorkspace": "Shared workspace",
    "dashboard.agentWorkspaces": "Agent workspaces",
    "dashboard.backgroundWork": "Background work",
    "dashboard.toolRuns": "Tool runs",
    "dashboard.usage": "Usage",
    "dashboard.trace": "Run trace",
    "settings.eyebrow": "Configuration",
    "settings.title": "Squad settings",
    "settings.subtitle": "Tune capabilities and execution settings away from the meeting table.",
    "settings.teammates": "Teammates",
    "settings.skills": "Skills",
    "settings.tools": "Tools",
    "settings.execution": "Execution",
    "settings.apiEndpoint": "API endpoint",
    "settings.autoResearch": "Automatic web research",
    "settings.autoResearchHelp": "Allow agents to send search queries without asking each time.",
    "settings.exploration": "Exploration mode",
    "settings.explorationHelp": "Allow deeper autonomous opportunity research with a larger bounded tool budget."
  },
  zh: {
    "nav.subtitle": "个人 AI 顾问团",
    "nav.home": "首页",
    "nav.meeting": "会议室",
    "nav.dashboard": "看板",
    "nav.settings": "设置",
    "home.eyebrow": "个人 AI 会议室",
    "home.title": "为需要讨论的问题打开一个专注会议室。",
    "home.subtitle": "输入主题，带入项目资料，让小队把混乱想法整理成决策、任务和下一步行动。",
    "home.start": "开始会议",
    "home.demo": "载入示例",
    "home.previewNow": "当前",
    "home.previewDecision": "先澄清真正的问题，再开始发散想法。",
    "home.previewNext": "下一步",
    "home.previewAction": "运行一个阶段，查看简报，再继续推进会议。",
    "home.previewWatch": "注意",
    "home.previewRisk": "把会议决策、诊断信息和配置分开放置。",
    "setup.title": "创建会议室",
    "setup.subtitle": "首页只保留启动讨论需要的信息。能力配置和运行诊断放到独立页面。",
    "setup.topic": "主题",
    "setup.topicPlaceholder": "产品决策、研究问题、项目方案...",
    "setup.contestType": "问题类型",
    "setup.goal": "目标",
    "setup.goalPlaceholder": "从粗略想法推进到可路演方案",
    "setup.constraints": "约束",
    "setup.constraintsPlaceholder": "截止时间、团队规模、交付物、工具、预算...",
    "setup.materials": "项目资料",
    "setup.materialsPlaceholder": "粘贴需求、判断标准、笔记、资料摘录或已有项目上下文...",
    "setup.importFiles": "导入文件",
    "setup.openRoom": "打开会议室",
    "room.eyebrow": "会议室",
    "room.pause": "暂停",
    "room.resume": "继续",
    "room.new": "新会议",
    "room.interrupt": "立即介入",
    "room.composerPlaceholder": "参与讨论、询问队友，或补充约束...",
    "room.send": "发送",
    "room.run": "运行会议",
    "room.next": "下一阶段",
    "room.summary": "总结",
    "brief.title": "会议简报",
    "brief.subtitle": "决策、行动和风险提醒",
    "brief.keyBrief": "关键简报",
    "brief.tasks": "任务中心",
    "brief.research": "研究更新",
    "brief.direction": "当前方向",
    "brief.actions": "下一步",
    "brief.risks": "注意事项",
    "brief.questions": "待确认问题",
    "brief.noBriefTitle": "还没有简报",
    "brief.noBriefText": "运行会议后，小队会把讨论整理成简洁的决策简报。",
    "brief.now": "当前",
    "brief.next": "下一步",
    "brief.watch": "注意",
    "brief.ask": "提问",
    "brief.waiting": "等待小队形成第一个结论。",
    "brief.noAction": "还没有明确行动。",
    "brief.noRisk": "还没有主要风险提醒。",
    "brief.noQuestion": "还没有待确认问题。",
    "dashboard.eyebrow": "运行状态",
    "dashboard.title": "看板",
    "dashboard.subtitle": "工作区状态、后台任务、工具运行和追踪日志放在这里查看。",
    "dashboard.sharedWorkspace": "共享工作区",
    "dashboard.agentWorkspaces": "Agent 工作区",
    "dashboard.backgroundWork": "后台任务",
    "dashboard.toolRuns": "工具运行",
    "dashboard.usage": "用量",
    "dashboard.trace": "运行轨迹",
    "settings.eyebrow": "配置",
    "settings.title": "小队设置",
    "settings.subtitle": "把能力配置和执行设置从会议桌面移到这里。",
    "settings.teammates": "队友",
    "settings.skills": "技能",
    "settings.tools": "工具",
    "settings.execution": "执行设置",
    "settings.apiEndpoint": "API 地址",
    "settings.autoResearch": "自动联网检索",
    "settings.autoResearchHelp": "开启后，agent 可以按需发送搜索请求，不必每次确认。",
    "settings.exploration": "探索模式",
    "settings.explorationHelp": "允许 agent 使用更大的受控工具预算进行深入探索。"
  }
};

const defaultMembers = [
  ["captain", "Captain", "Controls the room and summarizes decisions.", "#2563eb"],
  ["ideator", "Ideator", "Generates original angles and differentiators.", "#f97316"],
  ["engineer", "Engineer", "Checks technical feasibility and implementation path.", "#0891b2"],
  ["strategist", "Strategist", "Thinks about users, market, and value.", "#16a34a"],
  ["designer", "Designer", "Shapes experience, story, and presentation.", "#db2777"],
  ["critic", "Critic", "Finds weak spots and asks hard stakeholder questions.", "#7c3aed"]
].map(([id, name, role, color]) => ({ id, name, role, color }));
const savedSquadConfig = loadSquadConfig();
let members = savedSquadConfig.members || structuredClone(defaultMembers);
let disabledSkillIds = new Set(savedSquadConfig.disabledSkillIds || []);
let disabledToolIds = new Set(savedSquadConfig.disabledToolIds || []);

const stages = ["Framing", "Brainstorming", "Feasibility", "Challenge", "Convergence", "Action Plan", "Pitch Prep"];
const proposalKeywords = ["建议", "定位", "目标", "用户", "方案", "方向", "差异化", "定义", "proposal", "position", "goal", "user"];
const actionKeywords = ["任务", "下一步", "立刻", "24小时", "测试", "产出", "发布", "执行", "验证", "模板", "build", "next", "step", "test"];
const riskKeywords = ["风险", "漏洞", "假设", "失败", "成本", "屏蔽", "节奏", "不够", "问题", "risk", "weak", "cost", "fail"];
const questionKeywords = ["问题", "相关方", "为什么", "是否", "如何证明", "怎么", "question", "why", "whether"];
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
let currentView = "homeView";
let language = defaultLanguage;

const pageViews = [...document.querySelectorAll(".page-view")];
const navLinks = [...document.querySelectorAll("[data-view-target]")];
const homeView = document.querySelector("#homeView");
const roomView = document.querySelector("#roomView");
const dashboardView = document.querySelector("#dashboardView");
const settingsView = document.querySelector("#settingsView");
const meetingForm = document.querySelector("#meetingForm");
const loadDemoButton = document.querySelector("#loadDemoButton");
const languageButton = document.querySelector("#languageButton");
const apiBaseInput = document.querySelector("#apiBaseInput");
const resetConfigButton = document.querySelector("#resetConfigButton");
const openRoomButton = document.querySelector("#openRoomButton");
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
const decisionSnapshot = document.querySelector("#decisionSnapshot");
const briefCount = document.querySelector("#briefCount");
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
const diagnosticCount = document.querySelector("#diagnosticCount");
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

apiBaseInput.value = apiBase;
applyLanguage();
showView("homeView");
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
updateDiagnosticCount();
renderInterruptionQueue();
renderMaterialFiles();
refreshConfig();

function t(key) {
  return translations[language]?.[key] || translations.en[key] || key;
}

function showView(viewId) {
  currentView = viewId;
  pageViews.forEach((view) => view.classList.toggle("hidden", view.id !== viewId));
  navLinks.forEach((button) => {
    const active = button.dataset.viewTarget === viewId && !button.hasAttribute("data-focus-topic");
    button.classList.toggle("active", active);
    if (button.classList.contains("nav-link")) button.setAttribute("aria-current", active ? "page" : "false");
  });
}

function applyLanguage() {
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.setAttribute("placeholder", t(node.dataset.i18nPlaceholder));
  });
  languageButton.textContent = language === "zh" ? "EN" : "中文";
  renderPauseState();
}

function openCreateRoomPanel({ focus = false } = {}) {
  if (currentView !== "homeView") showView("homeView");
  meetingForm.classList.remove("setup-collapsed");
  meetingForm.setAttribute("aria-hidden", "false");
  window.setTimeout(() => {
    meetingForm.scrollIntoView({ behavior: "smooth", block: "start" });
    if (focus) meetingForm.elements.topic?.focus();
  }, 80);
}

function loadSquadConfig() {
  try {
    return JSON.parse(localStorage.getItem(SQUAD_CONFIG_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveSquadConfig() {
  localStorage.setItem(SQUAD_CONFIG_KEY, JSON.stringify({
    members,
    disabledSkillIds: [...disabledSkillIds],
    disabledToolIds: [...disabledToolIds]
  }));
}

function getSquadConfigPayload() {
  return {
    members,
    disabledSkillIds: [...disabledSkillIds],
    disabledToolIds: [...disabledToolIds]
  };
}

function syncMeetingSquadConfig() {
  if (meeting) meeting.squadConfig = getSquadConfigPayload();
}

navLinks.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.viewTarget;
    if (!target) return;
    showView(target);
    if (button.hasAttribute("data-focus-topic")) {
      openCreateRoomPanel({ focus: true });
    }
  });
});

languageButton.addEventListener("click", () => {
  language = language === "en" ? "zh" : "en";
  localStorage.setItem(LANGUAGE_KEY, language);
  applyLanguage();
  renderOutputs(currentBrief);
});

apiBaseInput.addEventListener("change", () => {
  apiBase = String(apiBaseInput.value || defaultApiBase).replace(/\/$/, "");
  localStorage.setItem(API_BASE_KEY, apiBase);
  refreshConfig();
});

meetingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(meetingForm);
  apiBase = String(apiBaseInput.value || defaultApiBase).replace(/\/$/, "");
  localStorage.setItem(API_BASE_KEY, apiBase);
  meeting = {
    topic: form.get("topic"),
    contestType: form.get("contestType"),
    goal: form.get("goal"),
    constraints: form.get("constraints"),
    projectMaterials: form.get("projectMaterials"),
    researchContext: "",
    autoWebResearch: autoResearchToggle.checked,
    explorationMode: explorationModeToggle.checked,
    squadConfig: getSquadConfigPayload()
  };
  await startMeeting();
});

loadDemoButton.addEventListener("click", () => {
  openCreateRoomPanel();
  meetingForm.elements.topic.value = "Should we build a lightweight AI meeting room for personal project decisions?";
  meetingForm.elements.contestType.value = "Product Decision";
  meetingForm.elements.goal.value = "Turn a rough product idea into a clear MVP direction and next-step plan";
  meetingForm.elements.constraints.value = "One week timeline, solo builder, GitHub Pages frontend, local API backend, no leaked API keys.";
  meetingForm.elements.projectMaterials.value = "Decision criteria: useful discussion quality, feasibility, privacy, ease of setup, and clear next actions. Existing idea: a personal multi-agent meeting room.";
  apiBaseInput.value = apiBase;
  requestAnimationFrame(() => meetingForm.scrollIntoView({ behavior: "smooth", block: "start" }));
});

resetConfigButton.addEventListener("click", () => {
  members = structuredClone(defaultMembers);
  disabledSkillIds = new Set();
  disabledToolIds = new Set();
  saveSquadConfig();
  syncMeetingSquadConfig();
  renderSquad();
  renderSkills();
  renderTools();
});

newMeetingButton.addEventListener("click", () => {
  pauseMeeting({ announce: false });
  streamEpoch += 1;
  meeting = null;
  history = [];
  stageIndex = 0;
  totalTokens = 0;
  usageByAgent = {};
  usageLine.textContent = "Ready";
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
  showView("homeView");
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
  showView("roomView");
  roomTitle.textContent = meeting.topic || "Squad Room";
  history = [];
  stageIndex = 0;
  totalTokens = 0;
  usageByAgent = {};
  usageLine.textContent = "Ready";
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

  await withBusy(openRoomButton, "Opening", async () => {
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
  pauseButton.textContent = isPaused ? t("room.resume") : t("room.pause");
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
  usageLine.textContent = totalTokens ? "Updated" : "Ready";
  renderUsageBreakdown();
}

function renderSquad() {
  const capabilities = new Map(squadCapabilities.map((member) => [member.id, member]));
  squadList.innerHTML = members
    .map((member) => {
      const capability = capabilities.get(member.id) || {};
      const skillNames = (capability.skills || []).filter((skill) => !disabledSkillIds.has(skill.id)).map((skill) => skill.name);
      const toolNames = (capability.tools || []).filter((tool) => !disabledToolIds.has(tool.id)).map((tool) => tool.name);
      return `
      <article class="member">
        <span class="member-dot" style="background:${member.color}"></span>
        <div>
          <strong>${escapeHtml(member.name)}</strong>
          <span>${escapeHtml(member.role)}</span>
          <details class="member-capabilities">
            <summary>${skillNames.length} skills - ${toolNames.length} tools</summary>
            <p><b>Skill</b> ${escapeHtml(skillNames.join(", ") || "General reasoning")}</p>
            <p><b>Tools</b> ${escapeHtml(toolNames.join(", ") || "No assigned tools")}</p>
          </details>
          <details class="member-config">
            <summary>Configure</summary>
            <label>
              <span>Name</span>
              <input class="member-name-input" data-member-id="${escapeHtml(member.id)}" value="${escapeHtml(member.name)}" />
            </label>
            <label>
              <span>Role</span>
              <textarea class="member-role-input" data-member-id="${escapeHtml(member.id)}">${escapeHtml(member.role)}</textarea>
            </label>
            <label>
              <span>Color</span>
              <input class="member-color-input" data-member-id="${escapeHtml(member.id)}" type="color" value="${escapeHtml(member.color)}" />
            </label>
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
  const reply = meta.respondingTo ? ` - responding to ${meta.respondingTo}` : "";
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
  const sections = getBriefSections(data);
  const itemTotal = sections.reduce((count, section) => count + section.items.length, 0);
  if (briefCount) briefCount.textContent = String(itemTotal);
  renderDecisionSnapshot(sections);
  outputs.innerHTML = itemTotal
    ? sections
        .filter((section) => section.items.length)
        .map((section) => renderBriefSection(section))
        .join("")
    : `
      <div class="brief-empty">
        <strong>${escapeHtml(t("brief.noBriefTitle"))}</strong>
        <span>${escapeHtml(t("brief.noBriefText"))}</span>
      </div>
    `;
}

function getBriefSections(data = {}) {
  return [
    { key: "proposal", label: t("brief.direction"), items: normalizeBriefItems(data.proposal) },
    { key: "actions", label: t("brief.actions"), items: normalizeBriefItems(data.actions) },
    { key: "risks", label: t("brief.risks"), items: normalizeBriefItems(data.risks) },
    { key: "questions", label: t("brief.questions"), items: normalizeBriefItems(data.questions) }
  ];
}

function normalizeBriefItems(items) {
  return Array.isArray(items)
    ? items.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 8)
    : [];
}

function renderDecisionSnapshot(sections) {
  if (!decisionSnapshot) return;
  const direction = sections.find((section) => section.key === "proposal")?.items[0] || "";
  const action = sections.find((section) => section.key === "actions")?.items[0] || "";
  const risk = sections.find((section) => section.key === "risks")?.items[0] || "";
  const question = sections.find((section) => section.key === "questions")?.items[0] || "";
  const cards = [
    { label: t("brief.now"), value: direction || t("brief.waiting") },
    { label: t("brief.next"), value: action || t("brief.noAction") },
    { label: t("brief.watch"), value: risk || t("brief.noRisk") },
    { label: t("brief.ask"), value: question || t("brief.noQuestion") }
  ];
  decisionSnapshot.innerHTML = cards
    .map((card) => `
      <article class="snapshot-card">
        <span>${escapeHtml(card.label)}</span>
        <p>${escapeHtml(formatBriefPreview(card.value, 180))}</p>
      </article>
    `)
    .join("");
}

function renderBriefSection(section) {
  const visible = section.items.slice(0, 3);
  const overflow = section.items.slice(3);
  return `
    <section class="output-block">
      <div class="output-block-header">
        <h4>${escapeHtml(section.label)}</h4>
        <span>${section.items.length}</span>
      </div>
      <div class="brief-list">
        ${visible.map((item) => renderBriefItem(item)).join("")}
      </div>
      ${overflow.length ? `
        <details class="brief-more">
          <summary>${overflow.length} more</summary>
          <div class="brief-list">${overflow.map((item) => renderBriefItem(item)).join("")}</div>
        </details>
      ` : ""}
    </section>
  `;
}

function renderBriefItem(item) {
  const attribution = splitBriefAttribution(item);
  return `
    <article class="brief-item">
      ${attribution.source ? `<span class="brief-source">${escapeHtml(attribution.source)}</span>` : ""}
      <div class="brief-markdown">${renderMarkdown(attribution.text)}</div>
    </article>
  `;
}

function splitBriefAttribution(item) {
  const match = String(item || "").match(/^([A-Za-z][\w -]{1,32}):\s+([\s\S]+)$/);
  if (!match) return { source: "", text: item };
  return { source: match[1], text: match[2] };
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
    ? availableSkills.map((skill) => `
        <label class="config-row">
          <input type="checkbox" class="skill-toggle" data-skill-id="${escapeHtml(skill.id)}" ${disabledSkillIds.has(skill.id) ? "" : "checked"} />
          <span>
            <strong>${escapeHtml(skill.name)}</strong>
            <small>${escapeHtml(getMemberName(skill.owner))}</small>
          </span>
        </label>
      `).join("")
    : '<span class="muted-line">Loading...</span>';
}

function renderTools() {
  toolCount.textContent = String(availableTools.length);
  toolRegistry.innerHTML = availableTools.length
    ? availableTools.map((tool) => `
        <label class="config-row tool-registry-item">
          <input type="checkbox" class="tool-toggle" data-tool-id="${escapeHtml(tool.id)}" ${disabledToolIds.has(tool.id) ? "" : "checked"} />
          <span>
            <strong>${escapeHtml(tool.name)}</strong>
            <small>${tool.approval === "user" ? "May ask approval" : "Automatic"}</small>
          </span>
        </label>
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
  updateDiagnosticCount();
}

function renderActivities() {
  activityCount.textContent = String(toolActivities.length);
  activityList.innerHTML = toolActivities.length
    ? toolActivities.map((activity) => renderActivity(activity)).join("")
    : '<p class="muted-line">No tool activity yet.</p>';
  updateDiagnosticCount();
}

function addBackgroundTask(task) {
  if (!task?.id) return;
  const existingIndex = backgroundTasks.findIndex((item) => item.id === task.id);
  if (existingIndex >= 0) backgroundTasks.splice(existingIndex, 1);
  backgroundTasks.unshift(task);
  backgroundTasks = backgroundTasks.slice(0, 20);
  renderBackgroundTasks();
  renderWorkspace();
  updateDiagnosticCount();
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
  updateDiagnosticCount();
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
            <span>${escapeHtml(item.ownerAgent || "captain")} - ${escapeHtml(item.deliverable || "action")}</span>
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
    ? visibleInboxItems.slice(0, 6).map((item) => renderInboxItem(item)).join("")
    : '<p class="muted-line">Background discoveries will arrive here without interrupting the discussion.</p>';
  agentWorkspaceList.innerHTML = members.map((member) => {
    const assigned = workItems.filter((item) => item.ownerAgent === member.id && item.status !== "archived").length;
    const discoveries = visibleInboxItems.filter((item) => item.ownerAgent === member.id).length;
    const background = backgroundTasks.filter((item) => item.ownerAgent === member.id && ["queued", "running", "approval_required"].includes(item.status)).length;
    return `
      <div class="agent-workspace">
        <strong>${escapeHtml(member.name)}</strong>
        <span>${assigned} assigned - ${background} active - ${discoveries} discoveries</span>
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
  const isResearchNote = item.artifactType === "research-note" || /completed opportunity research/i.test(item.title || "");
  const groupKey = isResearchNote ? [
    item.stageCreated || "stage",
    item.ownerAgent || "agent",
    "research-note"
  ].join(":") : item.groupKey || budget.groupKey || [
    item.stageCreated || "stage",
    item.ownerAgent || "agent",
    item.artifactType || "note",
    budget.type || "task",
    budget.depth || "standard",
    Number.isFinite(callLimit) ? callLimit : 1
  ].join(":");

  return {
    ...item,
    groupKey,
    title: isResearchNote ? `${getMemberName(item.ownerAgent)} research brief` : item.title || `${getMemberName(item.ownerAgent)} update`,
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
    ? `${sourceCount} ${sourceCount === 1 ? "source" : "sources"}`
    : "No sources";
  const scope = `${searchCount} ${searchCount === 1 ? "search" : "searches"}`;
  const latestQuery = item.queries?.[0] ? truncateForUi(item.queries[0], 92) : "";
  const queryList = item.queries?.length
    ? `
      <details class="inbox-details">
        <summary>${item.queries.length === 1 ? "View query" : `View ${item.queries.length} queries`}</summary>
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
        <span>${escapeHtml(`${sourceLabel} from ${scope}`)}</span>
        ${latestQuery ? `<p>${escapeHtml(latestQuery)}</p>` : ""}
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
  if (impact === "useful") return "Research";
  return "Note";
}

function formatExplorationBudget(item) {
  const budget = item.budget || item || {};
  const depth = budget.depth || item.budgetDepth || "";
  const done = item.completedCalls || (Number.isFinite(Number(budget.callIndex)) ? Number(budget.callIndex) : 0);
  const limit = item.callLimit || (Number.isFinite(Number(budget.callLimit)) ? Number(budget.callLimit) : 0);
  const label = depth === "deep"
    ? "Exploration"
    : depth === "bounded"
      ? "Standard"
      : "Research";
  if (done && limit) return `${label} - ${Math.min(done, limit)}/${limit} searches`;
  if (limit) return `${label} - up to ${limit} searches`;
  return label;
}

function truncateForUi(value, max) {
  const text = String(value || "");
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function formatBriefPreview(value, max) {
  return truncateForUi(
    String(value || "")
      .replace(/^([A-Za-z][\w -]{1,32}):\s+/, "")
      .replace(/\*\*/g, "")
      .replace(/`/g, "")
      .replace(/^\s*[-*]\s+/, "")
      .replace(/\s+/g, " ")
      .trim(),
    max
  );
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
  updateDiagnosticCount();
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
    ? traceEvents.slice(0, 30).map((event) => `
        <article class="trace-item ${escapeHtml(event.type)}">
          <div>
            <strong>${escapeHtml(event.summary)}</strong>
            <span>${escapeHtml(event.at)} - ${escapeHtml(event.type)}</span>
          </div>
          ${Object.keys(event.meta || {}).length ? `
            <details class="trace-meta">
              <summary>Details</summary>
              <code>${escapeHtml(JSON.stringify(event.meta))}</code>
            </details>
          ` : ""}
        </article>
      `).join("")
    : '<p class="muted-line">Run trace events will appear here as the room works.</p>';
  updateDiagnosticCount();
}

function updateDiagnosticCount() {
  if (!diagnosticCount) return;
  const count = toolActivities.length + backgroundTasks.length + traceEvents.length;
  diagnosticCount.textContent = String(count);
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

squadList.addEventListener("input", (event) => {
  const field = event.target.closest("[data-member-id]");
  if (!field) return;
  const member = members.find((item) => item.id === field.dataset.memberId);
  if (!member) return;
  if (field.classList.contains("member-name-input")) member.name = field.value.trim() || member.name;
  if (field.classList.contains("member-role-input")) member.role = field.value.trim();
  if (field.classList.contains("member-color-input")) member.color = field.value;
  saveSquadConfig();
  syncMeetingSquadConfig();
  renderWorkspace();
});

squadList.addEventListener("change", (event) => {
  if (!event.target.classList.contains("member-color-input")) return;
  renderSquad();
});

skillList.addEventListener("change", (event) => {
  const checkbox = event.target.closest(".skill-toggle");
  if (!checkbox) return;
  if (checkbox.checked) disabledSkillIds.delete(checkbox.dataset.skillId);
  else disabledSkillIds.add(checkbox.dataset.skillId);
  saveSquadConfig();
  syncMeetingSquadConfig();
  renderSquad();
});

toolRegistry.addEventListener("change", (event) => {
  const checkbox = event.target.closest(".tool-toggle");
  if (!checkbox) return;
  if (checkbox.checked) disabledToolIds.delete(checkbox.dataset.toolId);
  else disabledToolIds.add(checkbox.dataset.toolId);
  saveSquadConfig();
  syncMeetingSquadConfig();
  renderSquad();
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
