# squad-room

Squad Room is a personal AI teammate room for competitions, projects, and serious brainstorming.

Chinese name: 小队会议室.

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
```

Any OpenAI-compatible provider can be used by changing `OPENAI_BASE_URL` and `OPENAI_MODEL`.

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
- Ask the squad a follow-up.
- Generate a final brief.
- View extracted outputs: proposal, actions, risks, and judge questions.

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
  .env.example
  SECURITY.md
```

## Status

This is an early MVP scaffold for personal use and developer experimentation.
