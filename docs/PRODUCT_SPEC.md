# Product Spec

## Product

Name: Squad Room

Chinese name: 小队会议室

Positioning: a personal multi-agent meeting room for problems that benefit from structured discussion, multiple perspectives, and actionable follow-through.

Example scenarios include product decisions, project planning, research questions, design reviews, investment analysis, personal decisions, and complex personal work.

## Target User

Early users are solo builders, students, independent makers, operators, researchers, and small teams who want a team-like thinking partner for decisions and project work.

## Core Loop

1. The user creates a meeting with a topic, discussion type, goal, and constraints.
2. The user can add project materials before the meeting starts.
3. The squad opens with a structured first round.
4. The user continues the meeting, interrupts, or asks for a specific teammate.
5. The user can pause an active request and resume from the last completed stage.
6. User messages join an interruption queue while a visible turn is active; the user can interrupt immediately when needed.
7. Silent background tasks can continue alongside the visible discussion and publish findings into shared context.
8. Project materials are retrieved into each agent turn by relevance.
9. The squad discusses, challenges, and refines the problem.
10. The room produces a brief: direction, actions, risks, and open questions.
11. The dashboard records operational details for debugging and review.

## Default Squad

| ID | Name | Role |
| --- | --- | --- |
| captain | Captain | Controls the room, frames the goal, and summarizes decisions. |
| ideator | Ideator | Generates original angles and alternatives. |
| engineer | Engineer | Checks technical feasibility and implementation path. |
| strategist | Strategist | Thinks about users, market, value, and decision criteria. |
| designer | Designer | Shapes experience, narrative, demo flow, and presentation. |
| critic | Critic | Finds weak spots and tests assumptions. |

## Meeting Stages

1. Framing
2. Brainstorming
3. Feasibility
4. Challenge
5. Convergence
6. Action Plan
7. Communication

## MVP Screens

- Home: create a meeting with topic, goal, constraints, and project materials.
- Meeting: focused discussion, controls, brief, tasks, and research updates.
- Dashboard: shared workspace, agent workspaces, background tasks, tool activity, usage, and run trace.
- Settings: teammates, skills, tools, API endpoint, automatic research, and exploration mode.

## Reading Experience

- Teammate output streams into the chat as it is generated.
- Message content is rendered as Markdown for headings, lists, tables, quotes, and code blocks.
- Rendered Markdown is sanitized in the browser before insertion.
- Meeting-only information stays in the meeting page; diagnostics and configuration live in separate pages.

## Skills and Tools

- Users can paste project materials or import explicitly selected TXT-like, PDF, DOCX, XLS, and XLSX files when opening a room.
- Imported files are parsed locally in the browser and added to the bounded meeting context.
- Teammates receive role-specific working methods from editable Markdown files.
- Low-risk local tools run automatically at bounded stages to read explicit context, create a Markdown artifact, and create tasks from the brief.
- Stage artifact tools create a research plan, option board, feasibility checklist, risk register, decision matrix, and communication outline as the meeting progresses.
- Artifact tools return Markdown plus structured JSON.
- Skills can be simple Markdown files or directory-style skill packs with `manifest.json`, `SKILL.md`, and optional smoke tests.
- A lightweight eval suite checks tool registration, skill pack shape, structured artifact output, retrieval hooks, and optional live API behavior.
- Agents propose stage-relevant web-search requests. Per-query approval is required by default; users can enable meeting-level automatic web research to send visible queries without asking each time.
- Captain handles user interruptions with one routed specialist selected from the message topic.
