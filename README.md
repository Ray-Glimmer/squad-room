# squad-room

[English](README.md) | [简体中文](README.zh-CN.md)

Squad Room is a personal AI teammate room for competitions, projects, and serious brainstorming.

The first open-source version is intentionally small:

- A static web app that can be hosted on GitHub Pages.
- A local Node.js API server that keeps model keys out of the browser.
- A mock mode that works without any API key.
- An OpenAI-compatible provider for real multi-agent discussion.

## Why This Shape

Multi-agent apps can burn tokens quickly, and browser-side API keys are easy to leak. Squad Room keeps the frontend static and sends all model traffic through a backend gateway.

```text
GitHub Pages / static frontend
  -> local or hosted API server
  -> OpenAI-compatible model provider
```

## Quick Start

Requirements:

- Node.js 20+
- No package install is required for the current MVP.

Start the API server:

```bash
cp .env.example apps/api/.env
npm run api
```

Restart the API server after pulling updates, especially when frontend/API endpoints change.

Open the web app:

```text
apps/web/index.html
```

By default, the app runs in mock mode if `OPENAI_API_KEY` is empty.

Run syntax checks:

```bash
npm run check
```

On Windows PowerShell, if script execution blocks `npm`, run:

```powershell
npm.cmd run check
```

## Environment Variables

Copy `.env.example` to `apps/api/.env`.

```env
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
API_PORT=8787
ALLOW_ORIGIN=*
SQUAD_ROOM_MOCK=false
```

Any OpenAI-compatible provider can be used by changing `OPENAI_BASE_URL` and `OPENAI_MODEL`.
Set `SQUAD_ROOM_MOCK=true` to force mock mode while testing streaming UI.

## Current MVP

- Create a meeting from a project or competition topic.
- Talk with six default teammates:
  - Captain
  - Ideator
  - Engineer
  - Strategist
  - Designer
  - Critic
- Continue the meeting through staged discussion.
- Run the meeting through all fixed stages and then generate a summary.
- Pause an active meeting, preserve interrupted streamed output, queue notes while paused, and process those notes before resuming the discussion.
- Queue user messages while teammates are speaking, with an optional immediate interrupt.
- Keep user interventions queued until the squad reply succeeds; retry failed sends or merge a new interruption without losing the original context.
- Control the meeting from chat with commands such as `stop`, `pause`, `resume`, `interrupt`, `next`, `run`, `summary`, `retry`, `clear queue`, and `help`; natural phrases like "pause the meeting" or "stop for a moment" are also recognized when they are clearly control intents.
- Let silent background research continue alongside the visible discussion.
- Review role-specific skills and tool permissions for each teammate.
- Track assigned work items, owners, and deliverable types in Task Center.
- Inspect token usage by agent and completed tool runs.
- Keep a shared meeting workspace, quiet Team Inbox, and per-agent workspace summaries.
- Use bounded opportunity exploration by default, or enable Exploration mode for deeper background research.
- Let teammates request additional high-value turns while keeping each meeting stage bounded and Captain-led.
- Ask the squad a follow-up.
- Generate a final brief.
- Stream teammate responses as they are generated.
- Render teammate messages as sanitized Markdown.
- Generate a structured brief once per stage with a bounded recorder step.
- Load teammate skills from editable Markdown files.
- Import common project-material files into the room context.
- Use visible local-first tools for project context, artifacts, tasks, and approved web-search requests.
- View extracted outputs: proposal, actions, risks, and judge questions.

## Project Materials

You can paste notes or import files before opening a room. Plain-text formats are read directly in the browser: TXT, Markdown, CSV, TSV, JSON, HTML, XML, YAML, and YML. PDF, DOCX, XLS, and XLSX files are also supported through parser libraries loaded on demand from jsDelivr.

Files are parsed locally in your browser. The files themselves are not uploaded to jsDelivr. When you open a room, the extracted text becomes part of the meeting context sent to your configured API server. Each file is limited to 10 MB, and the combined text context is limited to 12,000 characters.

## Skills and Tools

Each teammate has editable Markdown skills under `skills/`. The API injects the matching working methods into that teammate's prompt.

The current tool set is intentionally limited:

| Tool | Automatic behavior | Approval |
| --- | --- | --- |
| Read Project Context | Captain reads explicitly provided materials during Framing. | None |
| Create Brief Artifact | Captain refreshes a Markdown brief during Convergence and Summary. | None |
| Create Tasks | Engineer prepares action items during Action Plan and Summary. | None |
| Web Research | Agents propose stage-relevant research requests. By default each query waits for approval; enable Automatic web research to let agents send queries without asking each time. Results are added to shared context. | Optional user click |

Low-risk tools run automatically at bounded meeting stages and remain visible in Tool Activity. Task Center turns generated action items into visible assignments with an owner and deliverable type. Automatic web research is off by default and can be toggled when creating a meeting or from the room header. When enabled, agents may send visible search queries without per-query approval. Only search queries are sent to the search provider; project materials are not transmitted. This version does not read arbitrary files from your machine or run code.

Opportunity research is quiet by default: results arrive in Team Inbox instead of interrupting the conversation. Standard mode allows at most two opportunity-tool calls per stage. Exploration mode raises that bounded budget to four calls for deeper research. The shared workspace summarizes mission, decisions, open questions, artifacts, and activity. Agent workspace summaries expose assigned tasks, active background work, and discoveries.

Meeting stages are adaptive rather than rigid scripts. Each stage starts with a small set of required teammates. A silent scheduler may grant additional visible turns only for new evidence, consequential risks, decision changes, or material execution improvements. Each stage is bounded to six visible turns, each teammate can speak at most twice, and Captain closes valuable follow-up exchanges with a decision.

## GitHub Pages

The frontend is static. You can publish `apps/web` with GitHub Pages.

For a public deployment, keep API keys only in the API server environment. Never put real provider keys in frontend code, GitHub Pages variables, or committed files.

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
  .env.example
  SECURITY.md
```

## Status

This is an early MVP scaffold for personal use and developer experimentation.
