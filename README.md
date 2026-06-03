# squad-room

[English](README.md) | [简体中文](README.zh-CN.md)

Squad Room is a personal AI advisor team for competitions, projects, and serious brainstorming.

Open a room, give the squad a topic, and let six teammates discuss, challenge, research, summarize, and turn ideas into action.

[Live frontend](https://ray-glimmer.github.io/squad-room_agents/) · [Security](SECURITY.md) · [Architecture](docs/ARCHITECTURE.md)

## What You Get

| Area | What it does |
| --- | --- |
| Team discussion | Six default agents discuss from different roles: Captain, Ideator, Engineer, Strategist, Designer, and Critic. |
| Streaming chat | Teammate replies stream in real time and render as safe Markdown. |
| Current brief | The right panel keeps a concise brief of direction, actions, risks, and open questions. |
| Task Center | Decisions can become owner-based action items. |
| Team Inbox | Background research arrives quietly as grouped discovery cards. |
| Project materials | Paste notes or import common files before opening a room. |
| Chat controls | Use commands such as `pause`, `resume`, `next`, `run`, `summary`, and `clear queue`. Natural control phrases are also recognized. |
| Local-first keys | The browser never stores model API keys; model calls go through the API server. |

## Quick Start

Requirements:

- Node.js 20+
- No npm install is required for the current MVP.

Clone and start the API:

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

Open the frontend:

```text
apps/web/index.html
```

Or use the hosted static frontend:

```text
https://ray-glimmer.github.io/squad-room_agents/
```

The frontend uses `http://localhost:8787` by default. You can change the API endpoint on the setup screen.

## Use Mock Mode

Want to try the interface without a model key? Leave `OPENAI_API_KEY` empty, or set:

```env
SQUAD_ROOM_MOCK=true
```

Mock mode is useful for UI testing, demos, and development.

## Configure a Model

Copy `.env.example` to `apps/api/.env`, then edit:

```env
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
API_PORT=8787
ALLOW_ORIGIN=*
SQUAD_ROOM_MOCK=false
```

Any OpenAI-compatible provider can be used by changing `OPENAI_BASE_URL` and `OPENAI_MODEL`.

## How to Use

1. Enter a topic, goal, constraints, and optional project materials.
2. Choose whether agents can run automatic web research.
3. Open the room.
4. Let the squad discuss one stage at a time, or use **Run Meeting** to advance automatically.
5. Pause, interrupt, or add context whenever you need to steer the room.
6. Use the brief, inbox, and task center to turn the discussion into a plan.

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
| Ideator | Generates fresh angles, hooks, and alternatives. |
| Engineer | Checks feasibility, implementation, and technical risk. |
| Strategist | Thinks about users, market, positioning, and value. |
| Designer | Shapes user experience, story, visuals, and demo flow. |
| Critic | Finds weak assumptions and judge-style objections. |

Agent skills live in `skills/` as editable Markdown files.

## Tools

| Tool | Runs automatically | Approval |
| --- | --- | --- |
| Read Project Context | Reads explicitly provided project materials. | No |
| Create Brief Artifact | Refreshes the structured meeting brief. | No |
| Create Tasks | Turns decisions into visible work items. | No |
| Create Research Plan | Turns framing questions into a research plan. | No |
| Create Option Board | Compares brainstormed directions. | No |
| Create Feasibility Checklist | Converts feasibility concerns into checks. | No |
| Create Risk Register | Collects risks, mitigations, and evidence needs. | No |
| Create Decision Matrix | Helps compare converging options. | No |
| Create Pitch Outline | Turns the plan into a slide-by-slide story. | No |
| Web Research | Searches stage-relevant topics when enabled. | Optional |

These artifact tools follow the same spirit as an office workflow: each stage leaves behind a readable work product, not just chat. Automatic web research is off by default. When enabled, agents can send search queries without asking each time. Search results are added to shared context and summarized in Team Inbox.

## Developer Commands

```bash
npm run api
npm run check
npm run verify:screenshot
```

On Windows PowerShell:

```powershell
npm.cmd run api
npm.cmd run check
npm.cmd run verify:screenshot
```

`verify:screenshot` uses local Edge or Chrome headless mode to capture a frontend screenshot.

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
  skills/         # Editable teammate working methods
  scripts/        # Local verification utilities
  .env.example
  SECURITY.md
```

## Status

Squad Room is an early MVP for personal use and developer experimentation. It is already usable, but the product surface and agent workflow are still evolving.
