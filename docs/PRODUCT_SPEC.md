# Product Spec

## Product

Name: Squad Room

Chinese name: 小队会议室

Positioning: a personal AI squad room for competitions, hackathons, design contests, investment challenges, and project planning.

## Target User

Early target users are students, independent makers, competition participants, and solo builders who want a team-like thinking partner.

## Core Loop

1. User creates a meeting with a topic, contest type, goal, and constraints.
2. The squad opens with a structured first round.
3. The user continues the meeting, interrupts, or asks for a specific teammate.
4. The squad discusses, challenges, and refines the idea.
5. The room produces a brief: proposal, actions, risks, and judge questions.

## Default Squad

| ID | Name | Role |
| --- | --- | --- |
| captain | Captain | Controls the room, frames the goal, and summarizes decisions. |
| ideator | Ideator | Generates original angles and differentiators. |
| engineer | Engineer | Checks technical feasibility and implementation path. |
| strategist | Strategist | Thinks about users, market, business model, and value. |
| designer | Designer | Shapes experience, narrative, demo flow, and presentation. |
| critic | Critic | Finds weak spots and simulates tough judges. |

## Meeting Stages

1. Framing
2. Brainstorming
3. Feasibility
4. Challenge
5. Convergence
6. Action Plan
7. Pitch Prep

## MVP Screens

- Home: create a meeting.
- Room: squad list, chat stream, output panel, controls.
- Home API endpoint field: choose local or hosted API server without editing code.
- Docs: open-source safety notes and project purpose.

## Reading Experience

- Teammate output streams into the chat as it is generated.
- Message content is rendered as Markdown for headings, lists, tables, quotes, and code blocks.
- Rendered Markdown is sanitized in the browser before insertion.

## Skills and Tools

- Users can paste project materials or import explicitly selected TXT-like, PDF, DOCX, XLS, and XLSX files when opening a room.
- Imported files are parsed locally in the browser and added to the bounded meeting context.
- Teammates receive role-specific working methods from editable Markdown files.
- The room displays visible, scrollable tool activity with compact summaries and expandable results.
- Low-risk local tools run automatically at bounded stages to read explicit context, create a Markdown artifact, and create tasks from the brief.
- Agents propose stage-relevant web-search requests. Per-query approval is required by default; users can enable meeting-level automatic web research to send visible queries without asking each time. Results are added to shared research context.
