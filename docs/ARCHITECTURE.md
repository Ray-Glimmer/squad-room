# Architecture

## Overview

```text
apps/web
  Static browser app
  Stores meeting state in memory/session
  Calls apps/api over HTTP

apps/api
  Node.js HTTP server
  Orchestrates squad turns
  Calls mock provider or OpenAI-compatible provider
  Tracks rough usage per response
```

## API Server Responsibilities

- Keep provider API keys off the frontend.
- Select mock or real provider.
- Build squad prompts.
- Control meeting stages and speaking order.
- Return structured messages and extracted outputs.
- Avoid logging secrets.

## Frontend Responsibilities

- Collect meeting setup details.
- Render squad members, messages, and outputs.
- Let the user continue, interrupt, and summarize.
- Store only non-secret meeting state.

## Data Model

```ts
type SquadMember = {
  id: string;
  name: string;
  role: string;
  tone: string;
  color: string;
};

type MeetingMessage = {
  id: string;
  speakerId: string;
  speakerName: string;
  kind: "user" | "agent" | "system";
  content: string;
  stage: string;
  createdAt: string;
};
```

