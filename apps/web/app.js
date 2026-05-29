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

let apiBase = defaultApiBase;
let meeting = null;
let history = [];
let stageIndex = 0;
let totalTokens = 0;

const setupView = document.querySelector("#setupView");
const roomView = document.querySelector("#roomView");
const meetingForm = document.querySelector("#meetingForm");
const loadDemoButton = document.querySelector("#loadDemoButton");
const newMeetingButton = document.querySelector("#newMeetingButton");
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
    const result = await postJson("/api/meeting/continue", { meeting, history, stageIndex });
    applyResult(result);
  });
});

summaryButton.addEventListener("click", async () => {
  await withBusy(summaryButton, "Summarizing", async () => {
    const result = await postJson("/api/meeting/summary", { meeting, history });
    applyResult(result);
  });
});

messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = messageInput.value.trim();
  if (!message) return;
  messageInput.value = "";
  await withBusy(messageForm.querySelector("button"), "Sending", async () => {
    const result = await postJson("/api/meeting/message", { meeting, history, stageIndex, message });
    applyResult(result);
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
    const result = await postJson("/api/meeting/start", meeting);
    applyResult(result);
  });
}

function applyResult(result) {
  stageIndex = result.stageIndex ?? stageIndex;
  if (result.stage) stageBadge.textContent = result.stage;
  if (Array.isArray(result.messages)) {
    history = [...history, ...result.messages];
  }
  totalTokens += result.usage?.totalTokens || 0;
  usageLine.textContent = `${totalTokens.toLocaleString()} tokens`;
  renderMessages();
  renderOutputs(result.outputs || {});
}

function renderSquad() {
  squadList.innerHTML = members
    .map((member) => {
      return `
        <article class="member">
          <span class="member-dot" style="background:${member.color}"></span>
          <div>
            <strong>${escapeHtml(member.name)}</strong>
            <span>${escapeHtml(member.role)}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderMessages() {
  messageList.innerHTML = history
    .map((message) => {
      const kind = message.kind || "agent";
      return `
        <article class="message ${kind}">
          <div class="message-head">
            <span>${escapeHtml(message.speakerName || message.speakerId)}</span>
            <span class="message-stage">${escapeHtml(message.stage || "")}</span>
          </div>
          <p>${escapeHtml(message.content || "")}</p>
        </article>
      `;
    })
    .join("");
  messageList.scrollTop = messageList.scrollHeight;
}

function renderOutputs(data) {
  const sections = [
    ["Proposal", data.proposal],
    ["Actions", data.actions],
    ["Risks", data.risks],
    ["Judge Questions", data.questions]
  ];
  outputs.innerHTML = sections
    .map(([title, items]) => {
      const list = Array.isArray(items) && items.length ? items : ["Waiting for the squad to discuss this."];
      return `
        <section class="output-block">
          <h4>${title}</h4>
          <ul>${list.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </section>
      `;
    })
    .join("");
}

async function refreshConfig() {
  try {
    const config = await getJson("/api/config");
    statusLine.textContent = `${config.mode} mode · ${config.model}`;
  } catch {
    statusLine.textContent = `API offline · ${apiBase}`;
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
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }
  return response.json();
}

async function withBusy(button, label, task) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = label;
  try {
    await task();
  } catch (error) {
    history.push({
      id: crypto.randomUUID(),
      speakerId: "system",
      speakerName: "System",
      kind: "system",
      content: error.message || "Something went wrong.",
      stage: "Error",
      createdAt: new Date().toISOString()
    });
    renderMessages();
  } finally {
    button.disabled = false;
    button.textContent = original;
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
