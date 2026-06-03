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
  Streams teammate tokens over server-sent events
  Tracks rough usage per response
  Loads editable teammate skills
  Executes a small allowlisted tool registry
```

## API Server Responsibilities

- Keep provider API keys off the frontend.
- Select mock or real provider.
- Build squad prompts.
- Control meeting stages and speaking order.
- Return structured messages and extracted outputs.
- Return streaming events for live teammate output.
- Avoid logging secrets.
- Keep tool execution allowlisted and inspectable.

## Frontend Responsibilities

- Collect meeting setup details.
- Render squad members, messages, and outputs.
- Render streamed messages as sanitized Markdown.
- Let the user continue, interrupt, and summarize.
- Abort an active stream when paused and retry the interrupted step on resume.
- Queue user interruptions instead of opening concurrent visible streams.
- Show silent background-task progress separately from foreground discussion.
- Store only non-secret meeting state.
- Show tool activity and approval requests.

## Skills

Skills live under `skills/<teammate>/`. Each skill is a Markdown working method injected into the matching teammate prompt.

## Tool Registry

```text
read_project_file             Read only pasted project materials
write_artifact                Convert current brief to Markdown
update_task                   Convert brief actions to local todo items
create_research_plan          Produce a research plan from framing questions
create_option_board           Produce a comparable option board
create_feasibility_checklist  Produce technical and execution checks
create_risk_register          Produce a risk, mitigation, and evidence table
create_decision_matrix        Produce a convergence comparison matrix
create_pitch_outline          Produce a pitch or demo outline
web_search                    Fetch search results into shared context after approval, or automatically when the meeting toggle is enabled
```

The local artifact tools are deterministic Markdown generators inspired by office-style workflows: they create inspectable work products without reading arbitrary local paths, running code, or controlling desktop applications. Web search remains the only external-data tool.

## Streaming Events

The frontend uses `POST /api/meeting/*/stream` endpoints. Responses are `text/event-stream`.

```text
meta           Current stage and stage index
message_start  Placeholder message for one teammate
token          Incremental text chunk for that message
message_done   Final message object
brief          Structured current-state brief after the stage
background_task Silent task state update
done           Outputs and usage for the whole request
error          Stream-level error message
```

## Meeting Concurrency

- Foreground discussion is single-stream: visible agent turns, queued user interruptions, and stage progression do not race each other.
- User messages queue while a visible request is active. `Interrupt now` cancels the current visible step, processes the queue, and lets automatic meeting mode retry the interrupted stage.
- Background web research can run alongside visible teammate output. Results enter shared research context before the stage brief is recorded.
- Captain responds to user interruptions with one topic-routed specialist instead of always waking the same teammate pair.

## Brief Recorder

After each stage, the API runs one bounded recorder step. The recorder does not join the debate or trigger more agent turns. It returns four concise arrays:

```text
proposal   Current direction and decisions
actions    Concrete next actions
risks      Material risks and assumptions
questions  Open questions that still block confidence
```

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
