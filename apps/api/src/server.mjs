import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = join(__dirname, "..");
const repoRoot = join(apiRoot, "..", "..");
loadEnv(join(apiRoot, ".env"));

const PORT = Number(process.env.API_PORT || 8787);
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "*";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const USE_PROVIDER = Boolean(OPENAI_API_KEY) && process.env.SQUAD_ROOM_MOCK !== "true";

const caches = {
  materialChunks: createLruCache({ maxEntries: 100, ttlMs: 60 * 60 * 1000 }),
  materialRetrieval: createLruCache({ maxEntries: 500, ttlMs: 20 * 60 * 1000 }),
  structuredBrief: createLruCache({ maxEntries: 160, ttlMs: 8 * 60 * 1000 }),
  toolResult: createLruCache({ maxEntries: 320, ttlMs: 30 * 60 * 1000 }),
  webSearch: createLruCache({ maxEntries: 120, ttlMs: 15 * 60 * 1000 })
};

const skills = [
  loadSkill("project-lead", "Project Lead", "captain", "skills/captain/project-lead.md"),
  loadSkill("task-orchestration", "Task Orchestration", "captain", "skills/captain/task-orchestration.md"),
  loadSkill("meeting-qa", "Meeting QA", "captain", "skills/captain/meeting-qa"),
  loadSkill("idea-expansion", "Idea Expansion", "ideator", "skills/ideator/idea-expansion.md"),
  loadSkill("concept-testing", "Concept Testing", "ideator", "skills/ideator/concept-testing.md"),
  loadSkill("option-portfolio", "Option Portfolio", "ideator", "skills/ideator/option-portfolio.md"),
  loadSkill("technical-review", "Technical Review", "engineer", "skills/engineer/technical-review.md"),
  loadSkill("delivery-planning", "Delivery Planning", "engineer", "skills/engineer/delivery-planning.md"),
  loadSkill("prototype-spec", "Prototype Spec", "engineer", "skills/engineer/prototype-spec.md"),
  loadSkill("competitor-research", "Competitor Research", "strategist", "skills/strategist/competitor-research.md"),
  loadSkill("market-validation", "Market Validation", "strategist", "skills/strategist/market-validation.md"),
  loadSkill("evidence-plan", "Evidence Plan", "strategist", "skills/strategist/evidence-plan.md"),
  loadSkill("demo-story", "Demo Story", "designer", "skills/designer/demo-story.md"),
  loadSkill("experience-mapping", "Experience Mapping", "designer", "skills/designer/experience-mapping.md"),
  loadSkill("presentation-asset-plan", "Presentation Asset Plan", "designer", "skills/designer/presentation-asset-plan.md"),
  loadSkill("pitch-review", "Stakeholder Review", "critic", "skills/critic/pitch-review.md"),
  loadSkill("assumption-audit", "Assumption Audit", "critic", "skills/critic/assumption-audit.md"),
  loadSkill("quality-gate", "Quality Gate", "critic", "skills/critic/quality-gate.md")
];

const tools = [
  { id: "read_project_file", name: "Read Project Context", approval: "none", trigger: "automatic", risk: "low", agents: ["captain", "engineer", "strategist", "critic"] },
  { id: "write_artifact", name: "Create Brief Artifact", approval: "none", trigger: "automatic", risk: "low", agents: ["captain", "designer"] },
  { id: "update_task", name: "Create Tasks", approval: "none", trigger: "automatic", risk: "low", agents: ["captain", "engineer"] },
  { id: "create_research_plan", name: "Create Research Plan", approval: "none", trigger: "automatic", risk: "low", agents: ["captain", "strategist", "critic"] },
  { id: "create_option_board", name: "Create Option Board", approval: "none", trigger: "automatic", risk: "low", agents: ["ideator", "designer", "captain"] },
  { id: "create_feasibility_checklist", name: "Create Feasibility Checklist", approval: "none", trigger: "automatic", risk: "low", agents: ["engineer", "captain"] },
  { id: "create_risk_register", name: "Create Risk Register", approval: "none", trigger: "automatic", risk: "low", agents: ["critic", "engineer", "captain"] },
  { id: "create_decision_matrix", name: "Create Decision Matrix", approval: "none", trigger: "automatic", risk: "low", agents: ["captain", "strategist", "critic"] },
  { id: "create_communication_outline", name: "Create Communication Outline", approval: "none", trigger: "automatic", risk: "low", agents: ["designer", "captain", "critic"] },
  { id: "web_search", name: "Web Research", approval: "user", trigger: "automatic_request", risk: "external", agents: ["ideator", "engineer", "strategist", "critic"] }
];

const squad = [
  {
    id: "captain",
    name: "Captain",
    role: "Controls the room, frames the goal, assigns focus, and summarizes decisions.",
    tone: "steady, concise, encouraging"
  },
  {
    id: "ideator",
    name: "Ideator",
    role: "Generates original angles, surprising combinations, and differentiators.",
    tone: "playful, energetic, possibility-driven"
  },
  {
    id: "engineer",
    name: "Engineer",
    role: "Checks technical feasibility, architecture, data, and implementation risks.",
    tone: "practical, precise, reality-aware"
  },
  {
    id: "strategist",
    name: "Strategist",
    role: "Analyzes users, market, business model, value, and positioning.",
    tone: "structured, sharp, business-minded"
  },
  {
    id: "designer",
    name: "Designer",
    role: "Shapes user experience, visual story, demo flow, and presentation.",
    tone: "human-centered, concrete, expressive"
  },
  {
    id: "critic",
    name: "Critic",
    role: "Finds weak spots, asks hard stakeholder questions, and tests assumptions.",
    tone: "direct, skeptical, useful"
  }
];

const stages = [
  "Framing",
  "Brainstorming",
  "Feasibility",
  "Challenge",
  "Convergence",
  "Action Plan",
  "Communication"
];

const stagePlans = {
  Framing: { required: ["captain", "strategist", "engineer"], optional: ["critic", "designer"], maxVisibleTurns: 6 },
  Brainstorming: { required: ["ideator", "designer", "captain"], optional: ["strategist", "critic", "engineer"], maxVisibleTurns: 6 },
  Feasibility: { required: ["engineer", "strategist", "critic"], optional: ["captain", "designer"], maxVisibleTurns: 6 },
  Challenge: { required: ["critic", "engineer", "captain"], optional: ["strategist", "designer"], maxVisibleTurns: 6 },
  Convergence: { required: ["captain", "strategist", "designer"], optional: ["critic", "engineer"], maxVisibleTurns: 6 },
  "Action Plan": { required: ["captain", "engineer", "designer"], optional: ["strategist", "critic"], maxVisibleTurns: 6 },
  Communication: { required: ["critic", "designer", "captain"], optional: ["strategist", "engineer"], maxVisibleTurns: 6 }
};
const MAX_TURNS_PER_AGENT = 2;
const MAX_ADAPTIVE_TURNS = 2;

const stageObjectives = {
  Framing: "turn the user's topic into a clear discussion problem, target stakeholder, decision criteria, and success conditions",
  Brainstorming: "produce a few differentiated options without losing sight of feasibility and user value",
  Feasibility: "separate what can be built now from what should remain a roadmap claim",
  Challenge: "stress-test the current direction and expose weak assumptions before decisions are locked",
  Convergence: "choose the strongest direction and explain what tradeoffs the team is accepting",
  "Action Plan": "turn the chosen direction into immediate tasks, owners, deliverables, and sequence",
  Communication: "prepare the explanation, handoff story, demo arc, and hard-question answers for stakeholders"
};

const memberContributions = {
  captain: "integrate the team's current state, decide what should happen next, and reduce ambiguity",
  ideator: "add original options or angles only when they improve the current direction",
  engineer: "convert ideas into buildable systems, constraints, milestones, and technical risks",
  strategist: "connect the idea to users, value, market logic, and decision criteria",
  designer: "make the user experience, demo flow, and presentation easier to understand",
  critic: "find the most consequential flaw, missing proof, or stakeholder objection"
};

const server = createServer(async (req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true, mode: USE_PROVIDER ? "provider" : "mock", cache: getCacheStats() });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/config") {
      sendJson(res, 200, {
        mode: USE_PROVIDER ? "provider" : "mock",
        model: USE_PROVIDER ? OPENAI_MODEL : "mock-squad",
        hasProviderKey: Boolean(OPENAI_API_KEY),
        squad: squad.map((member) => ({
          ...member,
          skills: skills.filter((skill) => skill.owner === member.id).map(({ content, ...skill }) => skill),
          tools: tools.filter((tool) => tool.agents.includes(member.id))
        })),
        stages,
        skills: skills.map(({ content, ...skill }) => skill),
        tools
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/tools/execute") {
      const body = await readJson(req);
      sendJson(res, 200, await executeTool(body));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/meeting/start") {
      const body = await readJson(req);
      const meeting = normalizeMeeting(body);
      const result = await runStage({ meeting, stageIndex: 0, history: [] });
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/meeting/start/stream") {
      const body = await readJson(req);
      const meeting = normalizeMeeting(body);
      await streamStageResponse(res, { meeting, stageIndex: 0, history: [] });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/meeting/continue") {
      const body = await readJson(req);
      const meeting = normalizeMeeting(body.meeting);
      const history = Array.isArray(body.history) ? body.history : [];
      const nextIndex = Math.min(Number(body.stageIndex || 0) + 1, stages.length - 1);
      const result = await runStage({ meeting, stageIndex: nextIndex, history });
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/meeting/continue/stream") {
      const body = await readJson(req);
      const meeting = normalizeMeeting(body.meeting);
      const history = Array.isArray(body.history) ? body.history : [];
      const nextIndex = Math.min(Number(body.stageIndex || 0) + 1, stages.length - 1);
      await streamStageResponse(res, { meeting, stageIndex: nextIndex, history });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/meeting/message") {
      const body = await readJson(req);
      const meeting = normalizeMeeting(body.meeting);
      const history = Array.isArray(body.history) ? body.history : [];
      const userMessage = String(body.message || "").trim();
      const stageIndex = Math.min(Number(body.stageIndex || 0), stages.length - 1);
      const result = await respondToUser({ meeting, stageIndex, history, userMessage });
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/meeting/message/stream") {
      const body = await readJson(req);
      const meeting = normalizeMeeting(body.meeting);
      const history = Array.isArray(body.history) ? body.history : [];
      const userMessage = String(body.message || "").trim();
      const stageIndex = Math.min(Number(body.stageIndex || 0), stages.length - 1);
      await streamUserResponse(res, { meeting, stageIndex, history, userMessage });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/meeting/summary") {
      const body = await readJson(req);
      const meeting = normalizeMeeting(body.meeting);
      const history = Array.isArray(body.history) ? body.history : [];
      const result = await summarize({ meeting, history });
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/meeting/summary/stream") {
      const body = await readJson(req);
      const meeting = normalizeMeeting(body.meeting);
      const history = Array.isArray(body.history) ? body.history : [];
      await streamSummaryResponse(res, { meeting, history });
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    sendJson(res, 500, { error: "Server error", message: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`squad-room API running on http://localhost:${PORT}`);
  console.log(`mode: ${USE_PROVIDER ? "provider" : "mock"}`);
});

async function runStage({ meeting, stageIndex, history }) {
  const stage = stages[stageIndex] || stages[0];
  const plan = stagePlans[stage] || { required: ["captain"], optional: [], maxVisibleTurns: 4 };
  const messages = [];
  const usage = createUsage();
  const turnCounts = {};

  for (const speakerId of plan.required) {
    const member = getMeetingMember(meeting, speakerId);
    const response = await askMember({ meeting, member, stage, history: [...history, ...messages] });
    messages.push(makeMessage(member, response.content, stage, { contributionType: "Core turn" }));
    addUsage(usage, response.usage, member.id);
    turnCounts[speakerId] = (turnCounts[speakerId] || 0) + 1;
  }
  await runAdaptiveTurns({ meeting, stage, plan, history, messages, usage, turnCounts });
  const brief = await buildStructuredBrief({ meeting, stage, history: [...history, ...messages] });
  addUsage(usage, brief.usage, "recorder");
  const toolActivities = await runAutomaticTools({ meeting, stage, brief: brief.outputs });

  return {
    stage,
    stageIndex,
    messages,
    outputs: brief.outputs,
    toolActivities,
    usage
  };
}

async function streamStageResponse(res, { meeting, stageIndex, history }) {
  startEventStream(res);
  const signal = createResponseAbortSignal(res);
  try {
    const stage = stages[stageIndex] || stages[0];
    const plan = stagePlans[stage] || { required: ["captain"], optional: [], maxVisibleTurns: 4 };
    const messages = [];
    const usage = createUsage();
    const turnCounts = {};
    sendEvent(res, "meta", { stage, stageIndex });
    const backgroundToolsPromise = startBackgroundTools({ meeting, stage, res, signal });

    for (const speakerId of plan.required) {
      const member = getMeetingMember(meeting, speakerId);
      const response = await streamMember({ res, meeting, member, stage, history: [...history, ...messages], signal, discussionMeta: { contributionType: "Core turn" } });
      messages.push(response.message);
      addUsage(usage, response.usage, member.id);
      turnCounts[speakerId] = (turnCounts[speakerId] || 0) + 1;
    }
    await runAdaptiveTurns({ meeting, stage, plan, history, messages, usage, turnCounts, res, signal });
    const backgroundToolActivities = await backgroundToolsPromise;
    const brief = await buildStructuredBrief({ meeting, stage, history: [...history, ...messages], signal });
    addUsage(usage, brief.usage, "recorder");
    sendEvent(res, "brief", { outputs: brief.outputs });
    const foregroundToolActivities = await runAutomaticTools({ meeting, stage, brief: brief.outputs, signal, includeResearch: false });
    for (const activity of foregroundToolActivities) sendEvent(res, "tool_activity", activity);
    const toolActivities = [...backgroundToolActivities, ...foregroundToolActivities];

    sendEvent(res, "done", {
      stage,
      stageIndex,
      outputs: brief.outputs,
      toolActivities,
      usage
    });
  } catch (error) {
    if (error.name !== "AbortError") sendEvent(res, "error", { message: error.message });
  } finally {
    if (!res.writableEnded) res.end();
  }
}

async function respondToUser({ meeting, stageIndex, history, userMessage }) {
  const stage = stages[stageIndex] || stages[0];
  const userEntry = {
    id: randomUUID(),
    speakerId: "user",
    speakerName: "You",
    kind: "user",
    content: userMessage,
    stage,
    createdAt: new Date().toISOString()
  };
  const speakers = selectUserResponders(userMessage);
  const messages = [userEntry];
  const usage = createUsage();

  for (const speakerId of speakers) {
    const member = getMeetingMember(meeting, speakerId);
    const response = await askMember({
      meeting,
      member,
      stage,
      history: [...history, ...messages],
      userMessage
    });
    messages.push(makeMessage(member, response.content, stage));
    addUsage(usage, response.usage, member.id);
  }
  const brief = await buildStructuredBrief({ meeting, stage, history: [...history, ...messages] });
  addUsage(usage, brief.usage, "recorder");
  const toolActivities = await runAutomaticTools({ meeting, stage, brief: brief.outputs, includeResearch: false });

  return {
    stage,
    stageIndex,
    messages,
    outputs: brief.outputs,
    toolActivities,
    usage
  };
}

async function streamUserResponse(res, { meeting, stageIndex, history, userMessage }) {
  startEventStream(res);
  const signal = createResponseAbortSignal(res);
  try {
    const stage = stages[stageIndex] || stages[0];
    const userEntry = {
      id: randomUUID(),
      speakerId: "user",
      speakerName: "You",
      kind: "user",
      content: userMessage,
      stage,
      createdAt: new Date().toISOString()
    };
    const messages = [userEntry];
    const usage = createUsage();
    sendEvent(res, "meta", { stage, stageIndex });
    sendEvent(res, "message_done", { message: userEntry });

    for (const speakerId of selectUserResponders(userMessage)) {
      const member = getMeetingMember(meeting, speakerId);
      const response = await streamMember({
        res,
        meeting,
        member,
        stage,
        history: [...history, ...messages],
        userMessage,
        signal
      });
      messages.push(response.message);
      addUsage(usage, response.usage, member.id);
    }
    const brief = await buildStructuredBrief({ meeting, stage, history: [...history, ...messages], signal });
    addUsage(usage, brief.usage, "recorder");
    sendEvent(res, "brief", { outputs: brief.outputs });
    const toolActivities = await runAutomaticTools({ meeting, stage, brief: brief.outputs, signal, includeResearch: false });
    for (const activity of toolActivities) sendEvent(res, "tool_activity", activity);

    sendEvent(res, "done", {
      stage,
      stageIndex,
      outputs: brief.outputs,
      toolActivities,
      usage
    });
  } catch (error) {
    if (error.name !== "AbortError") sendEvent(res, "error", { message: error.message });
  } finally {
    if (!res.writableEnded) res.end();
  }
}

async function summarize({ meeting, history }) {
  const member = getMeetingMember(meeting, "captain");
  const stage = "Summary";
  const prompt = [
    `Meeting topic: ${meeting.topic}`,
    `Discussion context: ${meeting.contestType}`,
    `Goal: ${meeting.goal}`,
    `Constraints: ${meeting.constraints}`,
    "",
    "Create a final squad brief with these exact sections:",
    "Proposal:",
    "Execution Plan:",
    "Risks:",
    "Stakeholder Questions:",
    "Next 48 Hours:"
  ].join("\n");
  const response = await callProvider({
    system: buildSystem(member, stage),
    user: `${prompt}\n\nConversation:\n${historyToText(history)}`
  });
  const message = makeMessage(member, response.content, stage);
  const brief = await buildStructuredBrief({ meeting, stage, history: [...history, message] });
  const usage = createUsage();
  addUsage(usage, response.usage, member.id);
  addUsage(usage, brief.usage, "recorder");
  const toolActivities = await runAutomaticTools({ meeting, stage, brief: brief.outputs, includeResearch: false });

  return {
    stage,
    stageIndex: stages.length - 1,
    messages: [message],
    outputs: brief.outputs,
    toolActivities,
    usage
  };
}

async function streamSummaryResponse(res, { meeting, history }) {
  startEventStream(res);
  const signal = createResponseAbortSignal(res);
  try {
    const member = getMeetingMember(meeting, "captain");
    const stage = "Summary";
    const stageIndex = stages.length - 1;
    const prompt = buildSummaryPrompt(meeting);
    sendEvent(res, "meta", { stage, stageIndex });
    const response = await streamMember({
      res,
      meeting,
      member,
      stage,
      history,
      overrideUser: `${prompt}\n\nConversation:\n${historyToText(history)}`,
      signal
    });
    const brief = await buildStructuredBrief({ meeting, stage, history: [...history, response.message], signal });
    const usage = createUsage();
    addUsage(usage, response.usage, member.id);
    addUsage(usage, brief.usage, "recorder");
    sendEvent(res, "brief", { outputs: brief.outputs });
    const toolActivities = await runAutomaticTools({ meeting, stage, brief: brief.outputs, signal, includeResearch: false });
    for (const activity of toolActivities) sendEvent(res, "tool_activity", activity);
    sendEvent(res, "done", {
      stage,
      stageIndex,
      outputs: brief.outputs,
      toolActivities,
      usage
    });
  } catch (error) {
    if (error.name !== "AbortError") sendEvent(res, "error", { message: error.message });
  } finally {
    if (!res.writableEnded) res.end();
  }
}

async function askMember({ meeting, member, stage, history, userMessage = "", discussionMeta = {} }) {
  if (!USE_PROVIDER) {
    return mockMemberReply({ meeting, member, stage, userMessage });
  }

  return callProvider({ system: buildSystem(member, stage), user: buildMemberUserPrompt({ meeting, member, stage, history, userMessage, discussionMeta }) });
}

async function runAdaptiveTurns({ meeting, stage, plan, history, messages, usage, turnCounts, res, signal }) {
  let adaptiveTurns = 0;
  while (adaptiveTurns < MAX_ADAPTIVE_TURNS && messages.length < plan.maxVisibleTurns - 1) {
    const candidates = [...new Set([...plan.optional, ...plan.required])]
      .filter((speakerId) => speakerId !== "captain")
      .filter((speakerId) => (turnCounts[speakerId] || 0) < MAX_TURNS_PER_AGENT)
      .filter((speakerId) => speakerId !== messages.at(-1)?.speakerId);
    if (!candidates.length) break;

    const request = await selectAdaptiveSpeaker({ meeting, stage, history: [...history, ...messages], candidates, adaptiveTurns, signal });
    addUsage(usage, request.usage, "scheduler");
    if (!request.speakerId) break;

    const member = getMeetingMember(meeting, request.speakerId);
    if (!member) break;
    const discussionMeta = {
      contributionType: request.impact === "risk" ? "Risk raised" : request.impact === "evidence" ? "New evidence" : "Follow-up",
      respondingTo: request.replyTo || messages.at(-1)?.speakerId || ""
    };
    const response = res
      ? await streamMember({ res, meeting, member, stage, history: [...history, ...messages], signal, discussionMeta })
      : await askMember({ meeting, member, stage, history: [...history, ...messages], discussionMeta });
    messages.push(res ? response.message : makeMessage(member, response.content, stage, discussionMeta));
    addUsage(usage, response.usage, member.id);
    turnCounts[member.id] = (turnCounts[member.id] || 0) + 1;
    adaptiveTurns += 1;
  }

  const lastSpeakerId = messages.at(-1)?.speakerId;
  if (!adaptiveTurns || lastSpeakerId === "captain" || messages.length >= plan.maxVisibleTurns || (turnCounts.captain || 0) >= MAX_TURNS_PER_AGENT) return;
  const member = getMeetingMember(meeting, "captain");
  const discussionMeta = { contributionType: "Captain decision", respondingTo: lastSpeakerId };
  const response = res
    ? await streamMember({ res, meeting, member, stage, history: [...history, ...messages], signal, discussionMeta })
    : await askMember({ meeting, member, stage, history: [...history, ...messages], discussionMeta });
  messages.push(res ? response.message : makeMessage(member, response.content, stage, discussionMeta));
  addUsage(usage, response.usage, member.id);
  turnCounts.captain = (turnCounts.captain || 0) + 1;
}

async function selectAdaptiveSpeaker({ meeting, stage, history, candidates, adaptiveTurns, signal }) {
  if (!USE_PROVIDER) {
    const speakerId = adaptiveTurns === 0 ? candidates[0] : "";
    return {
      speakerId,
      replyTo: history.at(-1)?.speakerId || "",
      impact: speakerId === "critic" ? "risk" : "decision",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    };
  }
  const response = await callProvider({
    system: [
      "You are the silent meeting scheduler for Squad Room.",
      "Select at most one teammate who should speak next.",
      "Choose a speaker only if they can add new evidence, expose a consequential risk, change a decision, or materially improve execution.",
      "Do not select someone for agreement, repetition, or minor polish.",
      "Return JSON only. No markdown fences."
    ].join("\n"),
    user: [
      `Topic: ${meeting.topic}`,
      `Stage: ${stage}`,
      `Stage objective: ${stageObjectives[stage]}`,
      `Eligible teammates: ${candidates.join(", ")}`,
      "",
      'Return {"speakerId":"","replyTo":"","impact":"decision|risk|evidence|execution","reason":""}.',
      'Use an empty speakerId when no additional visible turn is worthwhile.',
      "",
      "Recent discussion:",
      historyToText(history.slice(-8)).slice(-7000)
    ].join("\n"),
    signal
  });
  return { ...parseSpeakRequest(response.content, candidates), usage: response.usage };
}

function parseSpeakRequest(content, candidates) {
  try {
    const match = String(content || "").match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : {};
    const speakerId = candidates.includes(parsed.speakerId) ? parsed.speakerId : "";
    return {
      speakerId,
      replyTo: String(parsed.replyTo || ""),
      impact: ["decision", "risk", "evidence", "execution"].includes(parsed.impact) ? parsed.impact : "decision",
      reason: truncate(String(parsed.reason || ""), 180)
    };
  } catch {
    return { speakerId: "", replyTo: "", impact: "decision", reason: "" };
  }
}

function selectUserResponders(userMessage) {
  const text = String(userMessage || "").toLowerCase();
  const routes = [
    [["代码", "技术", "实现", "架构", "接口", "部署", "bug", "api", "code", "build"], "engineer"],
    [["用户", "市场", "商业", "增长", "投资", "竞品", "market", "business", "growth"], "strategist"],
    [["设计", "界面", "交互", "视觉", "体验", "演示", "design", "ui", "ux", "demo"], "designer"],
    [["点子", "创意", "方向", "方案", "脑暴", "idea", "creative", "option"], "ideator"],
    [["风险", "质疑", "漏洞", "反对", "相关方", "risk", "stakeholder", "weak"], "critic"]
  ];
  const specialist = routes.find(([keywords]) => keywords.some((keyword) => text.includes(keyword)))?.[1] || "critic";
  return specialist === "captain" ? ["captain"] : ["captain", specialist];
}

function buildMemberUserPrompt({ meeting, member, stage, history, userMessage = "", discussionMeta = {} }) {
  const recent = getRecentMessages(history, 8);
  const existing = summarizeExistingWork(history);
  const memberSkills = skills.filter((item) => item.owner === member.id && isSkillEnabled(meeting, item));
  const retrievedMaterials = retrieveProjectMaterials(meeting, [stage, member.name, userMessage, existing].join("\n"));
  const availableTools = tools
    .filter((tool) => tool.agents.includes(member.id) && isToolEnabled(meeting, tool))
    .map((tool) => `${tool.name} (${tool.approval === "none" ? "autonomous low-risk" : "requires approval unless auto research is enabled"})`)
    .join(", ");
  return [
    `Meeting topic: ${meeting.topic}`,
    `Discussion context: ${meeting.contestType}`,
    `Goal: ${meeting.goal}`,
    `Constraints: ${meeting.constraints}`,
    `Relevant project materials: ${retrievedMaterials}`,
    `Approved web research: ${meeting.researchContext}`,
    `Exploration mode: ${meeting.explorationMode ? "deep exploration enabled" : "bounded exploration, maximum two background searches"}`,
    `Current stage: ${stage}`,
    `Stage objective: ${stageObjectives[stage] || "advance the team's shared work product"}`,
    discussionMeta.respondingTo ? `You are responding to: ${discussionMeta.respondingTo}` : "",
    discussionMeta.contributionType ? `Expected contribution: ${discussionMeta.contributionType}` : "",
    "",
    "Current shared work state:",
    existing,
    "",
    "Relevant working method:",
    memberSkills.map((skill) => `## ${skill.name}\n${skill.content}`).join("\n\n") || "Use a practical, evidence-aware working method.",
    "",
    `Available tools: ${availableTools || "No tools assigned."}`,
    "Low-risk tools are executed automatically by the room at bounded stages. Ask for a tool result only when it materially improves the shared work product.",
    "",
    "Recent team conversation:",
    historyToText(recent),
    "",
    userMessage ? `User just said: ${userMessage}` : "",
    "Reply as this teammate in 2-4 concise paragraphs.",
    "Make a substantive contribution to the team's shared result, not a standalone opinion.",
    "Do not repeat points already made unless you are correcting, sharpening, or turning them into a decision.",
    "Respond to another teammate only when it materially changes the plan; otherwise fill the most important gap from your role.",
    "End with a concrete implication for the project: a decision, test, task, risk, stakeholder question, or communication point."
  ].join("\n");
}

async function callProvider({ system, user, signal }) {
  if (!USE_PROVIDER) {
    return {
      content: "Mock response.",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    };
  }

  const response = await fetch(`${OPENAI_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    }),
    signal
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Provider request failed: ${response.status} ${text.slice(0, 240)}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || "",
    usage: normalizeUsage(data.usage)
  };
}

async function streamMember({ res, meeting, member, stage, history, userMessage = "", overrideUser = "", signal, discussionMeta = {} }) {
  const id = randomUUID();
  let content = "";
  let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  const started = {
    id,
    speakerId: member.id,
    speakerName: member.name,
    kind: "agent",
    content: "",
    stage,
    discussionMeta,
    createdAt: new Date().toISOString()
  };
  sendEvent(res, "message_start", { message: started });
  signal?.throwIfAborted();

  if (!USE_PROVIDER) {
    const mock = mockMemberReply({ meeting, member, stage, userMessage });
    for (const token of chunkText(mock.content)) {
      signal?.throwIfAborted();
      content += token;
      sendEvent(res, "token", { id, token });
      await sleep(24);
    }
    usage = mock.usage;
  } else {
    const user = overrideUser || buildMemberUserPrompt({ meeting, member, stage, history, userMessage, discussionMeta });
    const response = await callProviderStream({
      system: buildSystem(member, stage),
      user,
      signal,
      onToken: (token) => {
        content += token;
        sendEvent(res, "token", { id, token });
      }
    });
    usage = response.usage.totalTokens ? response.usage : estimateUsage(content);
  }

  const message = { ...started, content };
  sendEvent(res, "message_done", { message, usage });
  return { message, usage };
}

async function callProviderStream({ system, user, onToken, signal }) {
  const response = await fetch(`${OPENAI_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.7,
      stream: true,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    }),
    signal
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Provider request failed: ${response.status} ${text.slice(0, 240)}`);
  }

  const usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() || "";

    for (const block of blocks) {
      const lines = block.split(/\r?\n/).filter((line) => line.startsWith("data:"));
      for (const line of lines) {
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        const parsed = JSON.parse(data);
        addUsage(usage, normalizeUsage(parsed.usage));
        const token = parsed.choices?.[0]?.delta?.content || "";
        if (token) onToken(token);
      }
    }
  }

  return { usage };
}

async function buildStructuredBrief({ meeting, stage, history, signal }) {
  if (!USE_PROVIDER) {
    return {
      outputs: extractOutputs(history),
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    };
  }

  const briefCacheKey = getStructuredBriefCacheKey({ meeting, stage, history });
  const cachedOutputs = caches.structuredBrief.get(briefCacheKey);
  if (cachedOutputs) {
    return {
      outputs: cachedOutputs,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    };
  }

  const response = await callProvider({
    system: [
      "You are the meeting recorder for Squad Room.",
      "Turn the discussion into a concise current-state brief.",
      "Do not continue the debate. Do not write commentary about the conversation.",
      "Use the same primary language as the discussion.",
      "Return JSON only. No markdown fences.",
      "Each array must contain 1-4 short, concrete items.",
      "Prefer decisions, tasks, measurable risks, and unresolved questions.",
      "Avoid speaker names unless attribution changes ownership or accountability.",
      "Avoid vague phrases such as 'continue exploring', 'the direction is clear', or 'this is worthwhile'."
    ].join("\n"),
    user: [
      `Topic: ${meeting.topic}`,
      `Discussion context: ${meeting.contestType}`,
      `Goal: ${meeting.goal}`,
      `Constraints: ${meeting.constraints}`,
      `Current stage: ${stage}`,
      "",
      "Return this exact JSON shape:",
      '{"proposal":[],"actions":[],"risks":[],"questions":[]}',
      "",
      "Discussion:",
      historyToText(history).slice(-14000)
    ].join("\n"),
    signal
  });

  const outputs = parseStructuredBrief(response.content, history);
  caches.structuredBrief.set(briefCacheKey, outputs);
  return { outputs, usage: response.usage };
}

function getStructuredBriefCacheKey({ meeting, stage, history }) {
  return `brief:${hashText([
    meeting.topic,
    meeting.contestType,
    meeting.goal,
    meeting.constraints,
    meeting.projectMaterialsHash,
    stage,
    historyToText(history).slice(-14000)
  ].join("\n"))}`;
}

function parseStructuredBrief(content, history) {
  try {
    const match = String(content || "").match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Brief JSON missing.");
    const parsed = JSON.parse(match[0]);
    return {
      proposal: normalizeBriefList(parsed.proposal),
      actions: normalizeBriefList(parsed.actions),
      risks: normalizeBriefList(parsed.risks),
      questions: normalizeBriefList(parsed.questions)
    };
  } catch {
    return extractOutputs(history);
  }
}

function normalizeBriefList(items) {
  const list = Array.isArray(items) ? items : [];
  const normalized = list
    .map((item) => truncate(String(item || "").replace(/\s+/g, " ").trim(), 180))
    .filter(Boolean)
    .slice(0, 4);
  return normalized.length ? normalized : ["Pending later stages."];
}

function buildSummaryPrompt(meeting) {
  return [
    `Meeting topic: ${meeting.topic}`,
    `Discussion context: ${meeting.contestType}`,
    `Goal: ${meeting.goal}`,
    `Constraints: ${meeting.constraints}`,
    "",
    "Create a final squad brief with these exact sections:",
    "Proposal:",
    "Execution Plan:",
    "Risks:",
    "Stakeholder Questions:",
    "Next 48 Hours:"
  ].join("\n");
}

function mockMemberReply({ meeting, member, stage, userMessage }) {
  const topic = meeting.topic || "this project";
  const snippets = {
    captain: {
      Framing: `For "${topic}", the team should first lock three things: the exact stakeholder, the decision criteria we need to satisfy, and the one-sentence promise. Without that, every later choice will feel arbitrary.`,
      Brainstorming: `I see the strongest brainstorming constraint now: every idea must survive a 90-second explanation to the people who need the outcome. Let's keep only ideas that can become a visible example, a memorable story, or a measurable result.`,
      Feasibility: `The current direction should be evaluated by clarity of proof. If we cannot show the core value in one small loop, it belongs in the roadmap, not the first version.`,
      Challenge: `The useful pressure test is proof. Any claim we keep needs a concrete artifact behind it: a screenshot, metric, workflow, user quote, or comparison.`,
      Convergence: `I would converge on one main user, one painful scenario, and one demo loop. That gives the rest of the team a stable target instead of a pile of possible features.`,
      "Action Plan": `The next practical sequence is: define the user story, build the smallest demo, draft the communication structure, then prepare answers for feasibility and impact.`,
      Communication: `The explanation should open with the user's pain, move quickly into the demo, then explain why the chosen scope is both feasible and meaningfully different.`
    },
    ideator: {
      Brainstorming: `What if the project feels less like a tool and more like a teammate? For "${topic}", the memorable angle could be a room where the user watches a small team think, argue, and ship.`,
      default: `I would look for a twist: combine a familiar workflow with a surprising interface. The idea should be simple enough to demo but interesting enough to remember.`
    },
    engineer: {
      Framing: `To make the framing buildable, define the smallest working loop: input, processing, output, and proof. If that loop is clear, the rest of the team can safely shape story and market around it.`,
      Feasibility: `The MVP should avoid heavy infrastructure. A static frontend plus a small API gateway is enough to prove the concept and protect API keys.`,
      Challenge: `The main technical risk is overbuilding orchestration. Fixed stages and clear turns are enough for version one; autonomy can come after the team proves the workflow helps.`,
      "Action Plan": `Build order: static room UI, mock provider, API gateway, real provider, usage tracking, then persistence.`,
      default: `I would keep the technical scope narrow and make the architecture easy to explain. Stakeholders trust working clarity.`
    },
    strategist: {
      Framing: `The key question is who urgently needs this discussion to become a better decision. Solo builders, small teams, and busy operators all have the same pain: not enough perspective, time, or review quality.`,
      Feasibility: `The value proposition is stronger if we promise a structured meeting workflow, not a generic chatbot. Users should feel it helps them move from topic to decision.`,
      Convergence: `Position it as an AI meeting room for hard problems: framing, brainstorming, feasibility review, task planning, and communication prep.`,
      default: `The market story should stay concrete: people do not buy "multi-agent"; they want a sharper project and a better chance to perform.`
    },
    designer: {
      Brainstorming: `The interface should feel like a real team room: teammates on the left, discussion in the middle, useful outputs on the right. No need for a decorative landing page.`,
      Convergence: `The strongest product feel comes from visible progress: stage labels, concise teammate turns, and a brief that gets richer as the room talks.`,
      Communication: `The demo should show one satisfying moment: the critic catches a flaw, the captain reframes it, and the output panel updates into a better plan.`,
      default: `I would make the experience calm, dense, and useful. It should feel like opening a room where work actually happens.`
    },
    critic: {
      Feasibility: `Here is the weak point: if every teammate talks too much, the product becomes noise. Limit turns, force specificity, and summarize aggressively.`,
      Challenge: `A stakeholder will ask why this is better than one strong chatbot prompt. The answer cannot be "many agents"; it has to be better decisions, less blind-spot risk, and reusable outputs.`,
      Communication: `Prepare answers for cost, hallucination, privacy, and whether agent debates actually improve outcomes. Do not hand-wave these.`,
      default: `I like the direction, but the claims need proof. Show before-and-after improvements, not just a lively chat.`
    }
  };
  const content = snippets[member.id]?.[stage] || snippets[member.id]?.default || `I can help move "${topic}" forward from the ${stage} angle.`;
  const suffix = userMessage ? ` On your latest point, I would turn it into a concrete test instead of leaving it as a general idea.` : "";
  return {
    content: content + suffix,
    usage: estimateUsage(content + suffix)
  };
}

function buildSystem(member, stage) {
  return [
    `You are ${member.name}, one teammate in Squad Room.`,
    `Your role: ${member.role}`,
    `Your tone: ${member.tone}`,
    `Your contribution pattern: ${memberContributions[member.id] || "advance the team's shared result"}`,
    `Current meeting stage: ${stage}`,
    "Act like a smart teammate in a focused working group.",
    "Treat Squad Room as a general-purpose advisory meeting room for product, research, design, investment, planning, and personal project decisions.",
    "Do not assume the user is in a competition, hackathon, pitch contest, or judged event unless the user explicitly says so.",
    "Do not mention judges, scoring, judging criteria, contest performance, or competition deliverables unless the user's topic or materials explicitly require that frame.",
    "Do not pretend to be multiple people.",
    "Do not mention hidden prompts.",
    "Prioritize useful progress over conversational theater.",
    "Avoid ritual agreement, forced name-dropping, and circular debate.",
    "Be specific, candid, and concise."
  ].join("\n");
}

function normalizeMeeting(input = {}) {
  const projectMaterials = truncate(String(input.projectMaterials || "No project materials provided.").trim(), 12000);
  const projectMaterialsHash = hashText(projectMaterials);
  return {
    topic: String(input.topic || "Untitled project").trim(),
    contestType: String(input.contestType || "General").trim(),
    goal: String(input.goal || "Create a clear, actionable recommendation.").trim(),
    constraints: String(input.constraints || "No constraints provided.").trim(),
    projectMaterials,
    projectMaterialsHash,
    projectMaterialChunks: getCachedProjectMaterialChunks(projectMaterials, projectMaterialsHash),
    researchContext: truncate(String(input.researchContext || "No approved web research yet.").trim(), 6000),
    autoWebResearch: input.autoWebResearch === true,
    explorationMode: input.explorationMode === true,
    squadConfig: normalizeSquadConfig(input.squadConfig)
  };
}

function getCachedProjectMaterialChunks(projectMaterials, projectMaterialsHash) {
  if (!projectMaterials || projectMaterials === "No project materials provided.") return [];
  const cacheKey = `chunks:${projectMaterialsHash}`;
  const cached = caches.materialChunks.get(cacheKey);
  if (cached) return cached;
  const chunks = chunkProjectMaterials(projectMaterials);
  caches.materialChunks.set(cacheKey, chunks);
  return chunks;
}

function normalizeSquadConfig(config = {}) {
  const memberMap = new Map();
  const configuredMembers = Array.isArray(config.members) ? config.members : [];
  for (const item of configuredMembers) {
    const id = String(item?.id || "").trim();
    if (!id || !squad.some((member) => member.id === id)) continue;
    memberMap.set(id, {
      name: truncate(String(item.name || "").trim(), 40),
      role: truncate(String(item.role || "").trim(), 180),
      color: String(item.color || "").trim()
    });
  }
  return {
    members: memberMap,
    disabledSkillIds: new Set(Array.isArray(config.disabledSkillIds) ? config.disabledSkillIds.map(String) : []),
    disabledToolIds: new Set(Array.isArray(config.disabledToolIds) ? config.disabledToolIds.map(String) : [])
  };
}

function getMeetingMember(meeting, id) {
  const base = squad.find((item) => item.id === id);
  if (!base) return null;
  const custom = meeting.squadConfig?.members?.get(id);
  return {
    ...base,
    name: custom?.name || base.name,
    role: custom?.role || base.role,
    color: custom?.color || base.color
  };
}

function isSkillEnabled(meeting, skill) {
  return !meeting.squadConfig?.disabledSkillIds?.has(skill.id);
}

function isToolEnabled(meeting, tool) {
  return !meeting.squadConfig?.disabledToolIds?.has(tool.id);
}

function chunkProjectMaterials(text, size = 900, overlap = 160) {
  const source = String(text || "").trim();
  if (!source || source === "No project materials provided.") return [];
  const chunks = [];
  let start = 0;
  while (start < source.length && chunks.length < 24) {
    const end = Math.min(source.length, start + size);
    const content = source.slice(start, end).replace(/\s+/g, " ").trim();
    if (content) chunks.push({ id: `material-${chunks.length + 1}`, content });
    if (end >= source.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks;
}

function retrieveProjectMaterials(meeting, query, limit = 4) {
  const chunks = Array.isArray(meeting.projectMaterialChunks) ? meeting.projectMaterialChunks : [];
  if (!chunks.length) return meeting.projectMaterials || "No project materials provided.";
  const queryTerms = tokenizeForRetrieval(query);
  const cacheKey = [
    "retrieval",
    meeting.projectMaterialsHash || hashText(meeting.projectMaterials || ""),
    limit,
    queryTerms.join("|")
  ].join(":");
  const cached = caches.materialRetrieval.get(cacheKey);
  if (cached) return cached;
  const ranked = chunks
    .map((chunk) => ({
      ...chunk,
      score: scoreChunk(chunk.content, queryTerms)
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
  const selected = ranked.some((chunk) => chunk.score > 0) ? ranked : chunks.slice(0, Math.min(limit, chunks.length));
  const result = selected
    .map((chunk) => `[${chunk.id}] ${chunk.content}`)
    .join("\n\n");
  caches.materialRetrieval.set(cacheKey, result);
  return result;
}

function tokenizeForRetrieval(text) {
  const words = String(text || "")
    .toLowerCase()
    .match(/[a-z0-9]{3,}|[\u4e00-\u9fff]{2,}/g) || [];
  return [...new Set(words)].slice(0, 80);
}

function scoreChunk(content, terms) {
  const text = String(content || "").toLowerCase();
  return terms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0);
}

function makeMessage(member, content, stage, discussionMeta = {}) {
  return {
    id: randomUUID(),
    speakerId: member.id,
    speakerName: member.name,
    kind: "agent",
    content,
    stage,
    discussionMeta,
    createdAt: new Date().toISOString()
  };
}

function extractOutputs(history) {
  const messages = Array.isArray(history)
    ? history.filter((message) => message.kind !== "system" && String(message.content || "").trim())
    : [];
  const bySpeaker = new Map();
  for (const message of messages) {
    bySpeaker.set(message.speakerId, message);
  }

  const captain = bySpeaker.get("captain");
  const strategist = bySpeaker.get("strategist");
  const engineer = bySpeaker.get("engineer");
  const designer = bySpeaker.get("designer");
  const critic = bySpeaker.get("critic");
  const ideator = bySpeaker.get("ideator");
  const text = messages.map((message) => message.content).join("\n");

  return {
    proposal: compactItems([
      summarizeMessage(captain),
      summarizeMessage(strategist),
      summarizeMessage(ideator)
    ], pickLines(text, ["建议", "定位", "目标", "用户", "方案", "promise", "position", "proposal"], 4)),
    actions: compactItems([
      summarizeMessage(engineer),
      ...pickLines(text, ["任务", "下一步", "立刻", "24小时", "测试", "产出", "build", "next", "step"], 4)
    ]),
    risks: compactItems([
      summarizeMessage(critic),
      ...pickLines(text, ["风险", "漏洞", "假设", "失败", "成本", "质疑", "risk", "weak", "stakeholder"], 4)
    ]),
    questions: compactItems([
      ...pickLines(text, ["问题", "相关方", "为什么", "是否", "如何证明", "ask", "question", "why"], 4),
      summarizeMessage(designer)
    ])
  };
}

function pickLines(text, keywords, limit) {
  const lines = text
    .split(/[。！？；\n.?!;]/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 8)
    .filter((line) => keywords.some((keyword) => line.toLowerCase().includes(keyword)))
    .slice(-limit);
  return lines;
}

function summarizeMessage(message) {
  if (!message?.content) return "";
  const content = String(message.content).replace(/\s+/g, " ").trim();
  if (!content) return "";
  const firstSentence = content.split(/[。！？]/).find((part) => part.trim().length >= 8) || content;
  const label = message.speakerName || message.speakerId || "Teammate";
  return `${label}: ${truncate(firstSentence.trim(), 140)}`;
}

function compactItems(primary, fallback = []) {
  const seen = new Set();
  const items = [...primary, ...fallback]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .filter((item) => {
      const key = normalizeBriefKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);
  return items.length ? items : ["Pending later stages."];
}

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function normalizeBriefKey(item) {
  return item
    .replace(/^[A-Za-z ]+:\s*/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function loadSkill(id, name, owner, relativePath) {
  const path = join(repoRoot, ...relativePath.split("/"));
  if (existsSync(path) && statSync(path).isDirectory()) {
    const manifestPath = join(path, "manifest.json");
    const skillPath = join(path, "SKILL.md");
    const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
    return {
      id: manifest.id || id,
      name: manifest.name || name,
      owner: manifest.owner || owner,
      description: manifest.description || "",
      version: manifest.version || "0.1.0",
      content: existsSync(skillPath) ? readFileSync(skillPath, "utf8") : ""
    };
  }
  return {
    id,
    name,
    owner,
    description: "",
    version: "0.1.0",
    content: existsSync(path) ? readFileSync(path, "utf8") : ""
  };
}

function getResearchCalls(meeting, stage) {
  const researchTool = tools.find((tool) => tool.id === "web_search");
  if (!researchTool || !isToolEnabled(meeting, researchTool)) return [];
  const queries = {
    Framing: `${meeting.topic} ${meeting.contestType} comparable examples decision criteria`,
    Feasibility: `${meeting.topic} implementation feasibility technical constraints examples`,
    Challenge: `${meeting.topic} risks failure cases criticism alternatives`,
    Communication: `${meeting.topic} evidence benchmarks case studies stakeholder questions`
  };
  if (!queries[stage]) return [];
  const ownerAgent = stage === "Feasibility" ? "engineer" : stage === "Challenge" ? "critic" : "strategist";
  const followUps = {
    Framing: [`${meeting.topic} user demand alternatives case study`, `${meeting.topic} market gap comparable products`, `${meeting.topic} emerging trends underserved users`],
    Feasibility: [`${meeting.topic} implementation failure cases limitations`, `${meeting.topic} open source alternatives benchmark`, `${meeting.topic} cost complexity maintenance tradeoffs`],
    Challenge: [`${meeting.topic} user complaints adoption barriers`, `${meeting.topic} competitor weaknesses lessons learned`, `${meeting.topic} strongest objections counter evidence`],
    Communication: [`${meeting.topic} measurable impact metrics evidence`, `${meeting.topic} stakeholder questions objections proof`, `${meeting.topic} successful communication examples differentiators`]
  };
  const limit = meeting.explorationMode ? 4 : 2;
  return [queries[stage], ...(meeting.explorationMode ? followUps[stage] || [] : [])]
    .slice(0, limit)
    .map((query, index) => ({
    toolId: "web_search",
    agentId: ownerAgent,
    exploration: {
      type: "opportunity",
      depth: meeting.explorationMode ? "deep" : "bounded",
      callIndex: index + 1,
      callLimit: limit
    },
    payload: {
      query,
      approved: meeting.autoWebResearch
    }
  }));
}

async function startBackgroundTools({ meeting, stage, res, signal }) {
  const calls = getResearchCalls(meeting, stage);
  return Promise.all(calls.map(async (call) => {
    const groupKey = [
      stage,
      call.agentId,
      "research-note",
      call.exploration.type,
      call.exploration.depth,
      call.exploration.callLimit
    ].join(":");
    const task = {
      id: randomUUID(),
      name: "Opportunity Research",
      ownerAgent: call.agentId,
      query: call.payload.query,
      status: call.payload.approved ? "running" : "approval_required",
      visibility: "inbox",
      taskType: "opportunity",
      budget: { ...call.exploration, groupKey },
      stageCreated: stage
    };
    sendEvent(res, "background_task", task);
    const activity = await executeTool({
      ...call,
      source: "background",
      automationKey: `${stage}:${call.toolId}:${call.exploration.callIndex}`
    }, { signal });
    if (activity.status === "completed") {
      appendResearchContext(meeting, activity);
      sendEvent(res, "inbox_item", makeInboxItem({ stage, task, activity }));
    }
    sendEvent(res, "tool_activity", activity);
    sendEvent(res, "background_task", {
      ...task,
      status: activity.status === "completed" ? "completed" : activity.status,
      message: activity.error || `${Array.isArray(activity.result) ? activity.result.length : 0} sources`
    });
    return activity;
  }));
}

function makeInboxItem({ stage, task, activity }) {
  const result = Array.isArray(activity.result) ? activity.result : [];
  return {
    id: randomUUID(),
    groupKey: task.budget?.groupKey,
    ownerAgent: task.ownerAgent,
    stageCreated: stage,
    impact: stage === "Challenge" ? "decision-changing" : "useful",
    title: `${displayAgentName(task.ownerAgent)} research update`,
    summary: result.length ? `${result.length} sources collected for: ${activity.query}` : "No sources collected.",
    query: activity.query,
    sourceCount: result.length,
    artifactType: "research-note",
    status: "unread",
    budget: task.budget,
    createdAt: new Date().toISOString()
  };
}

function displayAgentName(id) {
  return squad.find((member) => member.id === id)?.name || id || "Agent";
}

function appendResearchContext(meeting, activity) {
  if (!Array.isArray(activity.result)) return;
  const section = [
    `Research query: ${activity.query}`,
    ...activity.result.map((item, index) => `${index + 1}. ${item.title}\nSource: ${item.url}\nSummary: ${item.snippet || "No snippet available."}`)
  ].join("\n\n");
  meeting.researchContext = [meeting.researchContext, section]
    .filter(Boolean)
    .join("\n\n")
    .slice(-6000);
}

async function runAutomaticTools({ meeting, stage, brief, signal, includeResearch = true }) {
  const calls = [];
  const hasProjectMaterials = meeting.projectMaterials && meeting.projectMaterials !== "No project materials provided.";

  if (stage === "Framing") {
    if (hasProjectMaterials) {
      calls.push({
        toolId: "read_project_file",
        agentId: "captain",
        payload: { projectMaterials: meeting.projectMaterials }
      });
    }
  }

  const researchCalls = includeResearch ? getResearchCalls(meeting, stage) : [];
  calls.push(...researchCalls);

  if (stage === "Convergence" || stage === "Summary") {
    calls.push({ toolId: "write_artifact", agentId: "captain", payload: { brief } });
  }

  if (stage === "Framing") {
    calls.push({ toolId: "create_research_plan", agentId: "strategist", payload: { meeting, brief, stage } });
  }

  if (stage === "Brainstorming") {
    calls.push({ toolId: "create_option_board", agentId: "ideator", payload: { meeting, brief, stage } });
  }

  if (stage === "Feasibility") {
    calls.push({ toolId: "create_feasibility_checklist", agentId: "engineer", payload: { meeting, brief, stage } });
  }

  if (stage === "Challenge") {
    calls.push({ toolId: "create_risk_register", agentId: "critic", payload: { meeting, brief, stage } });
  }

  if (stage === "Convergence") {
    calls.push({ toolId: "create_decision_matrix", agentId: "captain", payload: { meeting, brief, stage } });
  }

  if (stage === "Communication" || stage === "Summary") {
    calls.push({ toolId: "create_communication_outline", agentId: "designer", payload: { meeting, brief, stage } });
  }

  if (stage === "Action Plan" || stage === "Summary") {
    calls.push({ toolId: "update_task", agentId: "captain", payload: { brief, stage } });
  }

  const enabledCalls = calls.filter((call) => {
    const tool = tools.find((item) => item.id === call.toolId);
    return tool && isToolEnabled(meeting, tool);
  });

  return Promise.all(enabledCalls.map((call) => executeTool({
    ...call,
    source: "automatic",
    automationKey: `${stage}:${call.toolId}`
  }, { signal })));
}

async function executeTool(body = {}, { signal } = {}) {
  const toolId = String(body.toolId || "");
  const agentId = String(body.agentId || "captain");
  const tool = tools.find((item) => item.id === toolId);
  if (!tool) return { ok: false, error: "Unknown tool." };
  if (!tool.agents.includes(agentId)) return { ok: false, error: `${agentId} cannot use ${toolId}.` };

  const payload = body.payload || {};
  const base = {
    ok: true,
    toolId,
    toolName: tool.name,
    agentId,
    source: String(body.source || "manual"),
    automationKey: String(body.automationKey || ""),
    exploration: body.exploration || null,
    createdAt: new Date().toISOString()
  };

  if (toolId === "read_project_file") {
    return completeToolWithCachedResult(base, payload, () => truncate(String(payload.projectMaterials || "No project materials provided.").trim(), 4000));
  }

  if (toolId === "write_artifact") {
    return completeToolWithCachedResult(base, payload, () => briefToMarkdown(payload.brief || {}));
  }

  if (toolId === "update_task") {
    const actions = Array.isArray(payload.brief?.actions) ? payload.brief.actions : [];
    return {
      ...base,
      status: "completed",
      result: actions.slice(0, 6).map((title, index) => ({
        id: `task-${Date.now()}-${index}`,
        title: String(title),
        ownerAgent: inferTaskOwner(title, index),
        status: "todo",
        deliverable: inferDeliverable(title),
        stageCreated: String(payload.stage || "Action Plan")
      }))
    };
  }

  if (toolId === "create_research_plan") {
    return completeToolWithCachedResult(base, payload, () => {
      const markdown = createResearchPlan(payload);
      return buildToolArtifact("research-plan", "Research Plan", payload.stage || "Framing", markdown);
    });
  }

  if (toolId === "create_option_board") {
    return completeToolWithCachedResult(base, payload, () => {
      const markdown = createOptionBoard(payload);
      return buildToolArtifact("option-board", "Option Board", payload.stage || "Brainstorming", markdown);
    });
  }

  if (toolId === "create_feasibility_checklist") {
    return completeToolWithCachedResult(base, payload, () => {
      const markdown = createFeasibilityChecklist(payload);
      return buildToolArtifact("feasibility-checklist", "Feasibility Checklist", payload.stage || "Feasibility", markdown);
    });
  }

  if (toolId === "create_risk_register") {
    return completeToolWithCachedResult(base, payload, () => {
      const markdown = createRiskRegister(payload);
      return buildToolArtifact("risk-register", "Risk Register", payload.stage || "Challenge", markdown);
    });
  }

  if (toolId === "create_decision_matrix") {
    return completeToolWithCachedResult(base, payload, () => {
      const markdown = createDecisionMatrix(payload);
      return buildToolArtifact("decision-matrix", "Decision Matrix", payload.stage || "Convergence", markdown);
    });
  }

  if (toolId === "create_communication_outline") {
    return completeToolWithCachedResult(base, payload, () => {
      const markdown = createCommunicationOutline(payload);
      return buildToolArtifact("communication-outline", "Communication Outline", payload.stage || "Communication", markdown);
    });
  }

  if (toolId === "web_search") {
    const query = truncate(String(payload.query || "").trim(), 240);
    if (!query) return { ok: false, error: "Search query is required." };
    if (payload.approved === true) {
      try {
        const result = await searchWeb(query, signal);
        return {
          ...base,
          status: "completed",
          query,
          result
        };
      } catch (error) {
        return {
          ...base,
          ok: false,
          status: "error",
          query,
          error: error.message || "Web research failed."
        };
      }
    }
    return {
      ...base,
      status: "approval_required",
      query
    };
  }

  return { ok: false, error: "Tool is not implemented." };
}

function completeToolWithCachedResult(base, payload, makeResult) {
  const cacheKey = `tool:${base.toolId}:${hashText(stableStringify(payload))}`;
  const cached = caches.toolResult.get(cacheKey);
  if (cached) {
    return {
      ...base,
      status: "completed",
      cache: "hit",
      result: cached
    };
  }
  const result = makeResult();
  caches.toolResult.set(cacheKey, result);
  return {
    ...base,
    status: "completed",
    cache: "miss",
    result
  };
}

function createResearchPlan({ meeting = {}, brief = {}, stage = "Framing" } = {}) {
  const questions = pickToolItems(brief.questions, [
    `Who most urgently needs ${meeting.topic || "this idea"}?`,
    "Which alternatives do users already use?",
    "What evidence would change the team's confidence?"
  ], 4);
  const risks = pickToolItems(brief.risks, ["No material risks identified yet."], 4);
  return [
    `# Research Plan`,
    "",
    `Stage: ${stage}`,
    "",
    `## Decision to Support`,
    "",
    `Clarify whether the current direction is worth pursuing for ${meeting.contestType || "this project"}.`,
    "",
    `## Research Questions`,
    "",
    markdownTable(
      ["Question", "Evidence to collect", "Owner", "Done when"],
      questions.map((question, index) => [
        question,
        index === 0 ? "User behavior, search demand, or comparable examples" : "Examples, objections, benchmarks, or quotes",
        index % 2 === 0 ? "Strategist" : "Critic",
        "A sourced note changes or confirms a decision"
      ])
    ),
    "",
    `## Watchouts`,
    "",
    risks.map((risk) => `- ${risk}`).join("\n")
  ].join("\n");
}

function createOptionBoard({ meeting = {}, brief = {}, stage = "Brainstorming" } = {}) {
  const options = pickToolItems(brief.proposal, [
    `Core version of ${meeting.topic || "the idea"}`,
    "Higher-risk differentiated version",
    "Fastest demoable version"
  ], 3);
  return [
    `# Option Board`,
    "",
    `Stage: ${stage}`,
    "",
    markdownTable(
      ["Option", "Hook", "Proof artifact", "Keep if"],
      options.map((option, index) => [
        option,
        index === 0 ? "Clear and credible" : index === 1 ? "Memorable contrast" : "Fast to demonstrate",
        index === 2 ? "Prototype or storyboard" : "Example, test, or comparison",
        "It improves stakeholder confidence without bloating scope"
      ])
    ),
    "",
    `## Selection Rule`,
    "",
    `Keep the option that can produce the strongest visible proof with the least extra complexity.`
  ].join("\n");
}

function createFeasibilityChecklist({ brief = {}, stage = "Feasibility" } = {}) {
  const actions = pickToolItems(brief.actions, ["Build the smallest inspectable prototype."], 5);
  const risks = pickToolItems(brief.risks, ["No blocking technical risk named yet."], 5);
  return [
    `# Feasibility Checklist`,
    "",
    `Stage: ${stage}`,
    "",
    `## Build Checks`,
    "",
    actions.map((action) => `- [ ] ${action}`).join("\n"),
    "",
    `## Failure Checks`,
    "",
    risks.map((risk) => `- [ ] Test or reduce: ${risk}`).join("\n"),
    "",
    `## QA Gate`,
    "",
    `The next demo should be inspectable, repeatable, and explainable in under 90 seconds.`
  ].join("\n");
}

function createRiskRegister({ brief = {}, stage = "Challenge" } = {}) {
  const risks = pickToolItems(brief.risks, ["The current direction may not have enough evidence yet."], 5);
  const questions = pickToolItems(brief.questions, ["What evidence would invalidate the plan?"], 5);
  return [
    `# Risk Register`,
    "",
    `Stage: ${stage}`,
    "",
    markdownTable(
      ["Risk", "Impact", "Mitigation", "Evidence Needed"],
      risks.map((risk, index) => [
        risk,
        index === 0 ? "High" : "Medium",
        "Reduce scope, test early, or prepare a stakeholder answer",
        questions[index] || "Concrete proof artifact"
      ])
    )
  ].join("\n");
}

function createDecisionMatrix({ brief = {}, stage = "Convergence" } = {}) {
  const options = pickToolItems(brief.proposal, ["Current direction", "Simpler MVP", "Differentiated stretch"], 3);
  return [
    `# Decision Matrix`,
    "",
    `Stage: ${stage}`,
    "",
    markdownTable(
      ["Option", "User value", "Feasibility", "Demo clarity", "Recommendation"],
      options.map((option, index) => [
        option,
        index === 0 ? "High if assumptions hold" : "Medium",
        index === 1 ? "High" : "Medium",
        index === 2 ? "Medium" : "High",
        index === 0 ? "Primary candidate" : "Backup or test variant"
      ])
    ),
    "",
    `## Tie-breaker`,
    "",
    `Choose the path that makes the clearest artifact for the next meeting, handoff, or stakeholder discussion.`
  ].join("\n");
}

function createCommunicationOutline({ meeting = {}, brief = {}, stage = "Communication" } = {}) {
  const proposal = pickToolItems(brief.proposal, [`Introduce ${meeting.topic || "the project"} clearly.`], 3);
  const actions = pickToolItems(brief.actions, ["Show the next concrete step."], 3);
  const risks = pickToolItems(brief.risks, ["Prepare one honest limitation."], 3);
  return [
    `# Communication Outline`,
    "",
    `Stage: ${stage}`,
    "",
    markdownTable(
      ["Section", "Claim", "Evidence or asset"],
      [
        ["1. Context", proposal[0], "User story or painful before-state"],
        ["2. Direction", proposal[1] || proposal[0], "One-screen workflow or demo moment"],
        ["3. Proof", actions[0], "Prototype, metric, comparison, or research note"],
        ["4. Plan", actions[1] || actions[0], "Timeline or task board"],
        ["5. Risks", risks[0], "Mitigation table or stakeholder answer"]
      ]
    ),
    "",
    `## Final Check`,
    "",
    `Every section should make one claim and show one inspectable artifact.`
  ].join("\n");
}

function pickToolItems(items, fallback, limit) {
  const source = Array.isArray(items) ? items : [];
  const cleaned = source
    .map((item) => truncate(String(item || "").replace(/\s+/g, " ").trim(), 140))
    .filter(Boolean)
    .filter((item) => item !== "Pending later stages.");
  return (cleaned.length ? cleaned : fallback).slice(0, limit);
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.map(escapeMarkdownCell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escapeMarkdownCell).join(" | ")} |`)
  ].join("\n");
}

function escapeMarkdownCell(value) {
  return String(value || "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim();
}

function buildToolArtifact(artifactType, title, stage, markdown) {
  return {
    kind: "artifact",
    artifactType,
    title,
    stage,
    markdown,
    data: parseArtifactMarkdown(markdown)
  };
}

function parseArtifactMarkdown(markdown) {
  const lines = String(markdown || "").split(/\r?\n/);
  return {
    sections: parseMarkdownSections(lines),
    tables: parseMarkdownTables(lines),
    checklists: parseMarkdownChecklists(lines)
  };
}

function parseMarkdownSections(lines) {
  const sections = [];
  let current = null;
  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)/);
    if (heading) {
      current = { title: heading[1].trim(), lines: [] };
      sections.push(current);
      continue;
    }
    if (current && line.trim()) current.lines.push(line.trim());
  }
  return sections;
}

function parseMarkdownTables(lines) {
  const tables = [];
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!isMarkdownTableRow(lines[index]) || !/^\|\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitMarkdownTableRow(lines[index]);
    const rows = [];
    index += 2;
    while (index < lines.length && isMarkdownTableRow(lines[index])) {
      rows.push(splitMarkdownTableRow(lines[index]));
      index += 1;
    }
    tables.push({ headers, rows });
  }
  return tables;
}

function parseMarkdownChecklists(lines) {
  return lines
    .map((line) => line.match(/^-\s+\[( |x)\]\s+(.+)/i))
    .filter(Boolean)
    .map((match) => ({ checked: match[1].toLowerCase() === "x", text: match[2].trim() }));
}

function isMarkdownTableRow(line) {
  return /^\|.*\|$/.test(String(line || "").trim());
}

function splitMarkdownTableRow(line) {
  return String(line || "")
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.replace(/\\\|/g, "|").trim());
}

async function searchWeb(query, signal) {
  const cacheKey = `web:${hashText(String(query || "").trim().toLowerCase())}`;
  const cached = caches.webSearch.get(cacheKey);
  if (cached) return cached;
  const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
    headers: {
      Accept: "text/html",
      "User-Agent": "Mozilla/5.0 SquadRoom/0.1"
    },
    signal: AbortSignal.any([AbortSignal.timeout(12000), signal].filter(Boolean))
  });
  if (!response.ok) throw new Error(`Search provider returned ${response.status}.`);
  const html = await response.text();
  const resultPattern = /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  const results = [];
  for (const match of html.matchAll(resultPattern)) {
    const url = normalizeSearchResultUrl(decodeHtml(match[1]));
    if (!url) continue;
    results.push({
      title: cleanSearchText(match[2]),
      url,
      snippet: cleanSearchText(match[3])
    });
    if (results.length >= 5) break;
  }
  if (!results.length) throw new Error("Search provider returned no readable results.");
  caches.webSearch.set(cacheKey, results);
  return results;
}

function normalizeSearchResultUrl(value) {
  try {
    const url = new URL(value, "https://html.duckduckgo.com");
    const target = url.searchParams.get("uddg");
    const resolved = new URL(target ? decodeURIComponent(target) : url.href);
    return ["http:", "https:"].includes(resolved.protocol) ? resolved.href : "";
  } catch {
    return "";
  }
}

function cleanSearchText(value) {
  return decodeHtml(String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function briefToMarkdown(brief) {
  const sections = [
    ["Current Direction", brief.proposal],
    ["Next Actions", brief.actions],
    ["Risks", brief.risks],
    ["Open Questions", brief.questions]
  ];
  return sections
    .map(([title, items]) => {
      const list = Array.isArray(items) && items.length ? items : ["Pending later stages."];
      return `## ${title}\n\n${list.map((item) => `- ${item}`).join("\n")}`;
    })
    .join("\n\n");
}

function historyToText(history) {
  return history
    .map((message) => `${message.speakerName || message.speakerId}: ${message.content}`)
    .join("\n");
}

function getRecentMessages(history, limit) {
  return Array.isArray(history) ? history.slice(-limit) : [];
}

function summarizeExistingWork(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return "No shared work has been established yet.";
  }
  const outputs = extractOutputs(history);
  return [
    `Proposal signals: ${outputs.proposal.join(" | ")}`,
    `Action signals: ${outputs.actions.join(" | ")}`,
    `Risk signals: ${outputs.risks.join(" | ")}`,
    `Question signals: ${outputs.questions.join(" | ")}`
  ].join("\n");
}

function normalizeUsage(usage = {}) {
  return {
    promptTokens: usage.prompt_tokens || usage.promptTokens || 0,
    completionTokens: usage.completion_tokens || usage.completionTokens || 0,
    totalTokens: usage.total_tokens || usage.totalTokens || 0
  };
}

function estimateUsage(text) {
  const tokens = Math.ceil(String(text).length / 4);
  return { promptTokens: 0, completionTokens: tokens, totalTokens: tokens };
}

function createUsage() {
  return { promptTokens: 0, completionTokens: 0, totalTokens: 0, byAgent: {} };
}

function addUsage(target, source = {}, agentId = "") {
  target.promptTokens += source.promptTokens || 0;
  target.completionTokens += source.completionTokens || 0;
  target.totalTokens += source.totalTokens || 0;
  if (!agentId) return;
  target.byAgent ||= {};
  target.byAgent[agentId] ||= { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  target.byAgent[agentId].promptTokens += source.promptTokens || 0;
  target.byAgent[agentId].completionTokens += source.completionTokens || 0;
  target.byAgent[agentId].totalTokens += source.totalTokens || 0;
}

function inferTaskOwner(title, index) {
  const text = String(title || "").toLowerCase();
  const routes = [
    [["code", "build", "implement", "technical", "api", "prototype", "开发", "实现", "技术", "原型"], "engineer"],
    [["user", "market", "growth", "competitor", "research", "用户", "市场", "增长", "竞品", "调研"], "strategist"],
    [["design", "visual", "demo", "story", "界面", "设计", "视觉", "演示"], "designer"],
    [["risk", "stakeholder", "validate", "test", "风险", "相关方", "验证", "测试"], "critic"],
    [["idea", "concept", "brainstorm", "创意", "点子", "方向"], "ideator"]
  ];
  return routes.find(([keywords]) => keywords.some((keyword) => text.includes(keyword)))?.[1]
    || ["captain", "engineer", "strategist", "designer"][index % 4];
}

function inferDeliverable(title) {
  const text = String(title || "").toLowerCase();
  if (["report", "research", "compare", "调研", "报告", "对比"].some((keyword) => text.includes(keyword))) return "report";
  if (["prototype", "demo", "build", "原型", "演示", "开发"].some((keyword) => text.includes(keyword))) return "prototype";
  if (["test", "validate", "验证", "测试"].some((keyword) => text.includes(keyword))) return "validation";
  return "action";
}

function createLruCache({ maxEntries = 100, ttlMs = 60000 } = {}) {
  const store = new Map();
  const stats = { hits: 0, misses: 0, sets: 0, evictions: 0 };
  return {
    get(key) {
      const entry = store.get(key);
      if (!entry) {
        stats.misses += 1;
        return null;
      }
      if (Date.now() > entry.expiresAt) {
        store.delete(key);
        stats.misses += 1;
        stats.evictions += 1;
        return null;
      }
      store.delete(key);
      store.set(key, entry);
      stats.hits += 1;
      return cloneCacheValue(entry.value);
    },
    set(key, value) {
      store.set(key, {
        value: cloneCacheValue(value),
        expiresAt: Date.now() + ttlMs
      });
      stats.sets += 1;
      while (store.size > maxEntries) {
        const oldestKey = store.keys().next().value;
        store.delete(oldestKey);
        stats.evictions += 1;
      }
    },
    stats() {
      const total = stats.hits + stats.misses;
      return {
        size: store.size,
        maxEntries,
        ttlMs,
        hits: stats.hits,
        misses: stats.misses,
        sets: stats.sets,
        evictions: stats.evictions,
        hitRate: total ? Number((stats.hits / total).toFixed(3)) : 0
      };
    }
  };
}

function cloneCacheValue(value) {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value));
  }
}

function getCacheStats() {
  return Object.fromEntries(Object.entries(caches).map(([name, cache]) => [name, cache.stats()]));
}

function hashText(value) {
  return createHash("sha256").update(String(value || "")).digest("hex").slice(0, 24);
}

function stableStringify(value) {
  return JSON.stringify(sortForStableStringify(value));
}

function sortForStableStringify(value) {
  if (value instanceof Map) return sortForStableStringify(Object.fromEntries(value));
  if (value instanceof Set) return [...value].sort();
  if (Array.isArray(value)) return value.map(sortForStableStringify);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortForStableStringify(value[key])])
  );
}

function loadEnv(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Private-Network", "true");
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload, null, 2));
}

function startEventStream(res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });
}

function createResponseAbortSignal(res) {
  const controller = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) controller.abort();
  });
  return controller.signal;
}

function sendEvent(res, event, payload) {
  if (res.destroyed || res.writableEnded) return;
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function chunkText(text) {
  const chunks = [];
  const source = String(text);
  for (let index = 0; index < source.length; index += 18) {
    chunks.push(source.slice(index, index + 18));
  }
  return chunks;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
