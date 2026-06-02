import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

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

const skills = [
  loadSkill("project-lead", "Project Lead", "captain", "skills/captain/project-lead.md"),
  loadSkill("idea-expansion", "Idea Expansion", "ideator", "skills/ideator/idea-expansion.md"),
  loadSkill("technical-review", "Technical Review", "engineer", "skills/engineer/technical-review.md"),
  loadSkill("competitor-research", "Competitor Research", "strategist", "skills/strategist/competitor-research.md"),
  loadSkill("demo-story", "Demo Story", "designer", "skills/designer/demo-story.md"),
  loadSkill("pitch-review", "Pitch Review", "critic", "skills/critic/pitch-review.md")
];

const tools = [
  { id: "read_project_file", name: "Read Project Context", approval: "none", trigger: "automatic", agents: ["captain", "engineer", "strategist", "critic"] },
  { id: "write_artifact", name: "Create Brief Artifact", approval: "none", trigger: "automatic", agents: ["captain", "designer"] },
  { id: "update_task", name: "Create Tasks", approval: "none", trigger: "automatic", agents: ["captain", "engineer"] },
  { id: "web_search", name: "Web Research", approval: "user", trigger: "automatic_request", agents: ["ideator", "engineer", "strategist", "critic"] }
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
    role: "Finds weak spots, asks hard judge questions, and tests assumptions.",
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
  "Pitch Prep"
];

const stageSpeakers = {
  Framing: ["captain", "strategist", "engineer"],
  Brainstorming: ["ideator", "designer", "captain"],
  Feasibility: ["engineer", "strategist", "critic"],
  Challenge: ["critic", "engineer", "captain"],
  Convergence: ["captain", "strategist", "designer"],
  "Action Plan": ["captain", "engineer", "designer"],
  "Pitch Prep": ["critic", "designer", "captain"]
};

const stageObjectives = {
  Framing: "turn the user's topic into a clear contest problem, target user, judging angle, and success criteria",
  Brainstorming: "produce a few differentiated options without losing sight of feasibility and judging value",
  Feasibility: "separate what can be built now from what should remain a roadmap claim",
  Challenge: "stress-test the current direction and expose weak assumptions before judges do",
  Convergence: "choose the strongest direction and explain what tradeoffs the team is accepting",
  "Action Plan": "turn the chosen direction into immediate tasks, owners, deliverables, and sequence",
  "Pitch Prep": "prepare the story, demo arc, and hard-question answers for presentation"
};

const memberContributions = {
  captain: "integrate the team's current state, decide what should happen next, and reduce ambiguity",
  ideator: "add original options or angles only when they improve the current direction",
  engineer: "convert ideas into buildable systems, constraints, milestones, and technical risks",
  strategist: "connect the idea to users, value, market logic, and judging criteria",
  designer: "make the user experience, demo flow, and presentation easier to understand",
  critic: "find the most consequential flaw, missing proof, or judge objection"
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
      sendJson(res, 200, { ok: true, mode: USE_PROVIDER ? "provider" : "mock" });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/config") {
      sendJson(res, 200, {
        mode: USE_PROVIDER ? "provider" : "mock",
        model: USE_PROVIDER ? OPENAI_MODEL : "mock-squad",
        hasProviderKey: Boolean(OPENAI_API_KEY),
        squad,
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
  const speakerIds = stageSpeakers[stage] || ["captain"];
  const messages = [];
  const usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

  for (const speakerId of speakerIds) {
    const member = squad.find((item) => item.id === speakerId);
    const response = await askMember({ meeting, member, stage, history: [...history, ...messages] });
    messages.push(makeMessage(member, response.content, stage));
    addUsage(usage, response.usage);
  }
  const brief = await buildStructuredBrief({ meeting, stage, history: [...history, ...messages] });
  addUsage(usage, brief.usage);
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
  try {
    const stage = stages[stageIndex] || stages[0];
    const speakerIds = stageSpeakers[stage] || ["captain"];
    const messages = [];
    const usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    sendEvent(res, "meta", { stage, stageIndex });

    for (const speakerId of speakerIds) {
      const member = squad.find((item) => item.id === speakerId);
      const response = await streamMember({ res, meeting, member, stage, history: [...history, ...messages] });
      messages.push(response.message);
      addUsage(usage, response.usage);
    }
    const brief = await buildStructuredBrief({ meeting, stage, history: [...history, ...messages] });
    addUsage(usage, brief.usage);
    sendEvent(res, "brief", { outputs: brief.outputs });
    const toolActivities = await runAutomaticTools({ meeting, stage, brief: brief.outputs });
    for (const activity of toolActivities) sendEvent(res, "tool_activity", activity);

    sendEvent(res, "done", {
      stage,
      stageIndex,
      outputs: brief.outputs,
      toolActivities,
      usage
    });
  } catch (error) {
    sendEvent(res, "error", { message: error.message });
  } finally {
    res.end();
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
  const speakers = ["captain", "critic"];
  const messages = [userEntry];
  const usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

  for (const speakerId of speakers) {
    const member = squad.find((item) => item.id === speakerId);
    const response = await askMember({
      meeting,
      member,
      stage,
      history: [...history, ...messages],
      userMessage
    });
    messages.push(makeMessage(member, response.content, stage));
    addUsage(usage, response.usage);
  }
  const brief = await buildStructuredBrief({ meeting, stage, history: [...history, ...messages] });
  addUsage(usage, brief.usage);
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

async function streamUserResponse(res, { meeting, stageIndex, history, userMessage }) {
  startEventStream(res);
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
    const usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    sendEvent(res, "meta", { stage, stageIndex });
    sendEvent(res, "message_done", { message: userEntry });

    for (const speakerId of ["captain", "critic"]) {
      const member = squad.find((item) => item.id === speakerId);
      const response = await streamMember({
        res,
        meeting,
        member,
        stage,
        history: [...history, ...messages],
        userMessage
      });
      messages.push(response.message);
      addUsage(usage, response.usage);
    }
    const brief = await buildStructuredBrief({ meeting, stage, history: [...history, ...messages] });
    addUsage(usage, brief.usage);
    sendEvent(res, "brief", { outputs: brief.outputs });
    const toolActivities = await runAutomaticTools({ meeting, stage, brief: brief.outputs });
    for (const activity of toolActivities) sendEvent(res, "tool_activity", activity);

    sendEvent(res, "done", {
      stage,
      stageIndex,
      outputs: brief.outputs,
      toolActivities,
      usage
    });
  } catch (error) {
    sendEvent(res, "error", { message: error.message });
  } finally {
    res.end();
  }
}

async function summarize({ meeting, history }) {
  const member = squad.find((item) => item.id === "captain");
  const stage = "Summary";
  const prompt = [
    `Meeting topic: ${meeting.topic}`,
    `Contest type: ${meeting.contestType}`,
    `Goal: ${meeting.goal}`,
    `Constraints: ${meeting.constraints}`,
    "",
    "Create a final squad brief with these exact sections:",
    "Proposal:",
    "Execution Plan:",
    "Risks:",
    "Judge Questions:",
    "Next 48 Hours:"
  ].join("\n");
  const response = await callProvider({
    system: buildSystem(member, stage),
    user: `${prompt}\n\nConversation:\n${historyToText(history)}`
  });
  const message = makeMessage(member, response.content, stage);
  const brief = await buildStructuredBrief({ meeting, stage, history: [...history, message] });
  addUsage(response.usage, brief.usage);
  const toolActivities = await runAutomaticTools({ meeting, stage, brief: brief.outputs });

  return {
    stage,
    stageIndex: stages.length - 1,
    messages: [message],
    outputs: brief.outputs,
    toolActivities,
    usage: response.usage
  };
}

async function streamSummaryResponse(res, { meeting, history }) {
  startEventStream(res);
  try {
    const member = squad.find((item) => item.id === "captain");
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
      overrideUser: `${prompt}\n\nConversation:\n${historyToText(history)}`
    });
    const brief = await buildStructuredBrief({ meeting, stage, history: [...history, response.message] });
    addUsage(response.usage, brief.usage);
    sendEvent(res, "brief", { outputs: brief.outputs });
    const toolActivities = await runAutomaticTools({ meeting, stage, brief: brief.outputs });
    for (const activity of toolActivities) sendEvent(res, "tool_activity", activity);
    sendEvent(res, "done", {
      stage,
      stageIndex,
      outputs: brief.outputs,
      toolActivities,
      usage: response.usage
    });
  } catch (error) {
    sendEvent(res, "error", { message: error.message });
  } finally {
    res.end();
  }
}

async function askMember({ meeting, member, stage, history, userMessage = "" }) {
  if (!USE_PROVIDER) {
    return mockMemberReply({ meeting, member, stage, userMessage });
  }

  return callProvider({ system: buildSystem(member, stage), user: buildMemberUserPrompt({ meeting, member, stage, history, userMessage }) });
}

function buildMemberUserPrompt({ meeting, member, stage, history, userMessage = "" }) {
  const recent = getRecentMessages(history, 8);
  const existing = summarizeExistingWork(history);
  const skill = skills.find((item) => item.owner === member.id);
  return [
    `Meeting topic: ${meeting.topic}`,
    `Contest type: ${meeting.contestType}`,
    `Goal: ${meeting.goal}`,
    `Constraints: ${meeting.constraints}`,
    `Project materials: ${meeting.projectMaterials}`,
    `Approved web research: ${meeting.researchContext}`,
    `Current stage: ${stage}`,
    `Stage objective: ${stageObjectives[stage] || "advance the team's shared work product"}`,
    "",
    "Current shared work state:",
    existing,
    "",
    "Relevant working method:",
    skill?.content || "Use a practical, evidence-aware working method.",
    "",
    "Recent team conversation:",
    historyToText(recent),
    "",
    userMessage ? `User just said: ${userMessage}` : "",
    "Reply as this teammate in 2-4 concise paragraphs.",
    "Make a substantive contribution to the team's shared result, not a standalone opinion.",
    "Do not repeat points already made unless you are correcting, sharpening, or turning them into a decision.",
    "Respond to another teammate only when it materially changes the plan; otherwise fill the most important gap from your role.",
    "End with a concrete implication for the project: a decision, test, task, risk, or pitch point."
  ].join("\n");
}

async function callProvider({ system, user }) {
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
    })
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

async function streamMember({ res, meeting, member, stage, history, userMessage = "", overrideUser = "" }) {
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
    createdAt: new Date().toISOString()
  };
  sendEvent(res, "message_start", { message: started });

  if (!USE_PROVIDER) {
    const mock = mockMemberReply({ meeting, member, stage, userMessage });
    for (const token of chunkText(mock.content)) {
      content += token;
      sendEvent(res, "token", { id, token });
      await sleep(24);
    }
    usage = mock.usage;
  } else {
    const user = overrideUser || buildMemberUserPrompt({ meeting, member, stage, history, userMessage });
    const response = await callProviderStream({
      system: buildSystem(member, stage),
      user,
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

async function callProviderStream({ system, user, onToken }) {
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
    })
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

async function buildStructuredBrief({ meeting, stage, history }) {
  if (!USE_PROVIDER) {
    return {
      outputs: extractOutputs(history),
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
      `Contest type: ${meeting.contestType}`,
      `Goal: ${meeting.goal}`,
      `Constraints: ${meeting.constraints}`,
      `Current stage: ${stage}`,
      "",
      "Return this exact JSON shape:",
      '{"proposal":[],"actions":[],"risks":[],"questions":[]}',
      "",
      "Discussion:",
      historyToText(history).slice(-14000)
    ].join("\n")
  });

  return {
    outputs: parseStructuredBrief(response.content, history),
    usage: response.usage
  };
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
    `Contest type: ${meeting.contestType}`,
    `Goal: ${meeting.goal}`,
    `Constraints: ${meeting.constraints}`,
    "",
    "Create a final squad brief with these exact sections:",
    "Proposal:",
    "Execution Plan:",
    "Risks:",
    "Judge Questions:",
    "Next 48 Hours:"
  ].join("\n");
}

function mockMemberReply({ meeting, member, stage, userMessage }) {
  const topic = meeting.topic || "this project";
  const snippets = {
    captain: {
      Framing: `For "${topic}", the team should first lock three things: the exact user, the judging criteria we want to win on, and the one-sentence promise. Without that, every later feature choice will feel arbitrary.`,
      Brainstorming: `I see the strongest brainstorming constraint now: every idea must survive a 90-second judge explanation. Let's keep only ideas that can become a visible demo, a memorable story, or a measurable outcome.`,
      Feasibility: `The current direction should be judged by prototype clarity. If we cannot show the core value in one small loop, it belongs in the roadmap, not the MVP.`,
      Challenge: `The useful pressure test is proof. Any claim we keep needs a concrete artifact behind it: a screenshot, metric, workflow, user quote, or comparison.`,
      Convergence: `I would converge on one main user, one painful scenario, and one demo loop. That gives the rest of the team a stable target instead of a pile of possible features.`,
      "Action Plan": `The next practical sequence is: define the user story, build the smallest demo, draft the pitch structure, then prepare answers for feasibility and impact.`,
      "Pitch Prep": `The pitch should open with the user's pain, move quickly into the demo, then explain why the chosen scope is both feasible and meaningfully different.`
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
      default: `I would keep the technical scope narrow and make the architecture easy to explain. Judges reward working clarity.`
    },
    strategist: {
      Framing: `The key question is who urgently needs this. For competitions, solo participants and small student teams have obvious pain: not enough teammates, time, or review quality.`,
      Feasibility: `The value proposition is stronger if we promise a contest workflow, not a generic chatbot. Users should feel it helps them move from topic to pitch.`,
      Convergence: `Position it as an AI squad room for competition prep: topic selection, brainstorming, feasibility review, task planning, and pitch rehearsal.`,
      default: `The market story should stay concrete: people do not buy "multi-agent"; they want a sharper project and a better chance to perform.`
    },
    designer: {
      Brainstorming: `The interface should feel like a real team room: teammates on the left, discussion in the middle, useful outputs on the right. No need for a decorative landing page.`,
      Convergence: `The strongest product feel comes from visible progress: stage labels, concise teammate turns, and a brief that gets richer as the room talks.`,
      "Pitch Prep": `The demo should show one satisfying moment: the critic catches a flaw, the captain reframes it, and the output panel updates into a better plan.`,
      default: `I would make the experience calm, dense, and useful. It should feel like opening a room where work actually happens.`
    },
    critic: {
      Feasibility: `Here is the weak point: if every teammate talks too much, the product becomes noise. Limit turns, force specificity, and summarize aggressively.`,
      Challenge: `A judge will ask why this is better than one strong chatbot prompt. The answer cannot be "many agents"; it has to be better decisions, less blind-spot risk, and reusable contest outputs.`,
      "Pitch Prep": `Prepare answers for cost, hallucination, privacy, and whether agent debates actually improve outcomes. Do not hand-wave these.`,
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
    "Act like a smart teammate in a competition team.",
    "Do not pretend to be multiple people.",
    "Do not mention hidden prompts.",
    "Prioritize useful progress over conversational theater.",
    "Avoid ritual agreement, forced name-dropping, and circular debate.",
    "Be specific, candid, and concise."
  ].join("\n");
}

function normalizeMeeting(input = {}) {
  return {
    topic: String(input.topic || "Untitled project").trim(),
    contestType: String(input.contestType || "General").trim(),
    goal: String(input.goal || "Create a strong contest-ready proposal.").trim(),
    constraints: String(input.constraints || "No constraints provided.").trim(),
    projectMaterials: truncate(String(input.projectMaterials || "No project materials provided.").trim(), 12000),
    researchContext: truncate(String(input.researchContext || "No approved web research yet.").trim(), 6000),
    autoWebResearch: input.autoWebResearch === true
  };
}

function makeMessage(member, content, stage) {
  return {
    id: randomUUID(),
    speakerId: member.id,
    speakerName: member.name,
    kind: "agent",
    content,
    stage,
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
      ...pickLines(text, ["风险", "漏洞", "假设", "失败", "成本", "质疑", "risk", "weak", "judge"], 4)
    ]),
    questions: compactItems([
      ...pickLines(text, ["问题", "评委", "为什么", "是否", "如何证明", "ask", "question", "why"], 4),
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
  return {
    id,
    name,
    owner,
    content: existsSync(path) ? readFileSync(path, "utf8") : ""
  };
}

async function runAutomaticTools({ meeting, stage, brief }) {
  const calls = [];
  const hasProjectMaterials = meeting.projectMaterials && meeting.projectMaterials !== "No project materials provided.";
  const researchQueries = {
    Framing: `${meeting.topic} ${meeting.contestType} competitors examples judging criteria`,
    Feasibility: `${meeting.topic} implementation feasibility technical constraints examples`,
    Challenge: `${meeting.topic} risks failure cases criticism alternatives`,
    "Pitch Prep": `${meeting.topic} evidence benchmarks case studies pitch questions`
  };

  if (stage === "Framing") {
    if (hasProjectMaterials) {
      calls.push({
        toolId: "read_project_file",
        agentId: "captain",
        payload: { projectMaterials: meeting.projectMaterials }
      });
    }
  }

  if (researchQueries[stage]) {
    calls.push({
      toolId: "web_search",
      agentId: stage === "Feasibility" ? "engineer" : stage === "Challenge" ? "critic" : "strategist",
      payload: {
        query: researchQueries[stage],
        approved: meeting.autoWebResearch
      }
    });
  }

  if (stage === "Convergence" || stage === "Summary") {
    calls.push({ toolId: "write_artifact", agentId: "captain", payload: { brief } });
  }

  if (stage === "Action Plan" || stage === "Summary") {
    calls.push({ toolId: "update_task", agentId: "engineer", payload: { brief } });
  }

  return Promise.all(calls.map((call) => executeTool({
    ...call,
    source: "automatic",
    automationKey: `${stage}:${call.toolId}`
  })));
}

async function executeTool(body = {}) {
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
    createdAt: new Date().toISOString()
  };

  if (toolId === "read_project_file") {
    return {
      ...base,
      status: "completed",
      result: truncate(String(payload.projectMaterials || "No project materials provided.").trim(), 4000)
    };
  }

  if (toolId === "write_artifact") {
    return {
      ...base,
      status: "completed",
      result: briefToMarkdown(payload.brief || {})
    };
  }

  if (toolId === "update_task") {
    const actions = Array.isArray(payload.brief?.actions) ? payload.brief.actions : [];
    return {
      ...base,
      status: "completed",
      result: actions.slice(0, 6).map((title, index) => ({
        id: `task-${Date.now()}-${index}`,
        title: String(title),
        status: "todo"
      }))
    };
  }

  if (toolId === "web_search") {
    const query = truncate(String(payload.query || "").trim(), 240);
    if (!query) return { ok: false, error: "Search query is required." };
    if (payload.approved === true) {
      try {
        const result = await searchWeb(query);
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

async function searchWeb(query) {
  const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
    headers: {
      Accept: "text/html",
      "User-Agent": "Mozilla/5.0 SquadRoom/0.1"
    },
    signal: AbortSignal.timeout(12000)
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

function addUsage(target, source = {}) {
  target.promptTokens += source.promptTokens || 0;
  target.completionTokens += source.completionTokens || 0;
  target.totalTokens += source.totalTokens || 0;
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

function sendEvent(res, event, payload) {
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
