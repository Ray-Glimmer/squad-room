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

Each teammate has an editable Markdown skill under `skills/`. The API injects the matching working method into that teammate's prompt.

The current tool set is intentionally limited:

| Tool | Automatic behavior | Approval |
| --- | --- | --- |
| Read Project Context | Captain reads explicitly provided materials during Framing. | None |
| Create Brief Artifact | Captain refreshes a Markdown brief during Convergence and Summary. | None |
| Create Tasks | Engineer prepares action items during Action Plan and Summary. | None |
| Request Web Search | Strategist proposes a visible research request during Framing. It does not search in the background. | User click |

Low-risk tools run automatically at bounded meeting stages and remain visible in Tool Activity. External web searches still wait for explicit approval. This first version does not read arbitrary files from your machine, run code, or transmit project materials to third-party search engines.

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
