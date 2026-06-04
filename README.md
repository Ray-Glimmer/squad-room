# squad-room

[English](README.md) | [简体中文](README.zh-CN.md)

Squad Room is a local-first multi-agent meeting room for problems that benefit from structured discussion.

Create a room, provide a topic and project context, and let a small AI team discuss, challenge, research, summarize, and turn ideas into action. Use it for product decisions, project planning, research questions, competition prep, investment analysis, design critique, or any problem that needs more than one perspective.

[Live frontend](https://ray-glimmer.github.io/squad-room_agents/) · [Security](SECURITY.md) · [Architecture](docs/ARCHITECTURE.md)

## Features

| Area | What it provides |
| --- | --- |
| Multi-agent discussion | Six default roles: Captain, Ideator, Engineer, Strategist, Designer, and Critic. |
| Streaming meeting room | Agent responses stream into the discussion and render as safe Markdown. |
| Focused brief | The meeting page highlights decisions, next actions, risks, and open questions. |
| Task center | Meeting outcomes can become owner-based action items. |
| Background research | Agents can run bounded web research when enabled; results are grouped as research updates. |
| Project materials | Paste notes or import common document formats before starting a room. |
| Material retrieval | The API chunks project materials and retrieves relevant snippets for each agent turn. |
| Operations dashboard | Tool runs, background work, usage, workspaces, and run traces live outside the meeting room. |
| Configurable skills and tools | Agent methods live in editable Markdown files and skill-pack directories. |
| Local-first key handling | The browser never stores model API keys; model calls go through the API server. |
| Bilingual interface | The frontend supports English and Simplified Chinese. |

## Interface

- **Home**: start a room with a topic, goal, constraints, and project materials.
- **Meeting**: discuss with the squad, steer the conversation, and read the current brief.
- **Dashboard**: inspect workspace state, background tasks, tool activity, usage, and run trace.
- **Settings**: review teammates, skills, tools, API endpoint, and research controls.

## Quick Start

Requirements:

- Node.js 20+
- No npm install is required for the current MVP.

Clone the repository and start the API:

```bash
git clone https://github.com/Ray-Glimmer/squad-room_agents.git
cd squad-room_agents
cp .env.example apps/api/.env
npm run api
```

On Windows PowerShell:

```powershell
Copy-Item .env.example apps/api/.env
npm.cmd run api
```

Open the static frontend:

```text
apps/web/index.html
```

Or use the hosted frontend:

```text
https://ray-glimmer.github.io/squad-room_agents/
```

The frontend connects to `http://localhost:8787` by default. You can change the API endpoint in **Settings**.

## Mock Mode

To try the interface without a model key, leave `OPENAI_API_KEY` empty or set:

```env
SQUAD_ROOM_MOCK=true
```

Mock mode is useful for UI testing, demos, and development.

## Model Configuration

Copy `.env.example` to `apps/api/.env`, then configure:

```env
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
API_PORT=8787
ALLOW_ORIGIN=*
SQUAD_ROOM_MOCK=false
```

Any OpenAI-compatible provider can be used by changing `OPENAI_BASE_URL` and `OPENAI_MODEL`.

## Basic Workflow

1. Enter a topic, goal, constraints, and optional project materials on the Home page.
2. Open the meeting room.
3. Let the squad discuss one stage at a time, or select **Run Meeting** to advance automatically.
4. Pause, interrupt, or add context whenever you need to steer the discussion.
5. Use the brief and task center to turn the conversation into an actionable plan.
6. Use Dashboard and Settings for operational details and configuration.

## Project Materials

You can paste notes or import files before opening a room.

Supported text formats:

```text
TXT, Markdown, CSV, TSV, JSON, HTML, XML, YAML, YML
```

Supported document formats:

```text
PDF, DOCX, XLS, XLSX
```

Files are parsed locally in the browser. When you open a room, extracted text becomes meeting context sent to your configured API server. Each file is limited to 10 MB, and the combined context is limited to 12,000 characters.

## Agent Roles

| Agent | Focus |
| --- | --- |
| Captain | Frames the goal, keeps the meeting moving, and summarizes decisions. |
| Ideator | Generates alternatives, hooks, and original angles. |
| Engineer | Checks feasibility, implementation path, and technical risk. |
| Strategist | Evaluates users, market, positioning, and value. |
| Designer | Shapes experience, story, visuals, and demo flow. |
| Critic | Tests assumptions and raises stakeholder-style objections. |

Agent skills live in `skills/` as editable Markdown files. Directory-style skill packs are also supported:

```text
skills/captain/meeting-qa/
  manifest.json
  SKILL.md
  smoke-test.md
```

## Tools

| Tool | Purpose | Approval |
| --- | --- | --- |
| Read Project Context | Reads explicitly provided project materials. | No |
| Create Brief Artifact | Refreshes the structured meeting brief. | No |
| Create Tasks | Turns decisions into visible work items. | No |
| Create Research Plan | Converts framing questions into a research plan. | No |
| Create Option Board | Compares brainstormed directions. | No |
| Create Feasibility Checklist | Converts feasibility concerns into checks. | No |
| Create Risk Register | Captures risks, mitigations, and evidence needs. | No |
| Create Decision Matrix | Compares converging options. | No |
| Create Pitch Outline | Turns a plan into a slide-by-slide story. | No |
| Web Research | Searches stage-relevant topics when enabled. | Optional |

Artifact tools return Markdown for reading and structured JSON for future filtering, export, or richer rendering. Automatic web research is off by default.

## Developer Commands

```bash
npm run api
npm run check
npm run eval
npm run verify:screenshot
```

On Windows PowerShell:

```powershell
npm.cmd run api
npm.cmd run check
npm.cmd run eval
npm.cmd run verify:screenshot
```

`eval` runs lightweight harness checks for tool registration, skill packs, structured artifacts, retrieval, and optional live API smoke tests. `verify:screenshot` uses local Edge or Chrome headless mode to capture a frontend screenshot.

## GitHub Pages

The frontend is static and can be hosted from `apps/web`.

For public deployments:

- Keep model API keys only in the API server environment.
- Do not put real API keys in frontend code, GitHub Pages variables, or committed files.
- Point the frontend to your local or hosted API endpoint.

## Project Layout

```text
squad-room/
  apps/
    api/          # Local API server and model gateway
    web/          # Static GitHub Pages-ready frontend
  docs/           # Product, architecture, deployment, and security notes
  packages/
    shared/       # Shared config reference
  skills/         # Editable agent methods
  scripts/        # Local verification utilities
  .env.example
  SECURITY.md
```

## Status

Squad Room is an early MVP for personal use and developer experimentation. The core flow is usable, while the interface, tools, and agent workflow continue to evolve.
