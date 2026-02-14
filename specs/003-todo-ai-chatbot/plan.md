# Implementation Plan: Todo AI Chatbot

**Branch**: `003-todo-ai-chatbot` | **Date**: 2026-02-10 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/003-todo-ai-chatbot/spec.md`

## Summary

Build an AI-powered chatbot that manages todos through natural language. The system uses OpenAI Agents SDK to process user messages, an MCP server (Official MCP SDK) to expose 5 task management tools, and OpenAI ChatKit for the frontend UI. A single stateless FastAPI endpoint orchestrates the flow: receive message → fetch conversation history from DB → run agent with MCP tools → persist response → return result.

## Technical Context

**Language/Version**: Python 3.12+ (backend), TypeScript 5+ (frontend)
**Primary Dependencies**: FastAPI, OpenAI Agents SDK (`openai-agents`), Official MCP SDK (`mcp`), OpenAI ChatKit (`@openai/chatkit-react`), SQLModel
**Storage**: Neon PostgreSQL (existing from Phase II) — adds Conversation and Message tables
**Testing**: pytest (backend), manual integration testing (frontend)
**Target Platform**: Web — Vercel (frontend) + Railway (backend)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Chat response within 10 seconds including AI + MCP tool execution
**Constraints**: Stateless server — no in-memory conversation state; all state persisted to DB
**Scale/Scope**: Single-user at a time, shared Neon PostgreSQL, 5 MCP tools, 1 chat endpoint

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| Spec-driven development | PASS | Spec written before plan, plan before code |
| No manual coding | PASS | All code generated via Claude Code |
| Smallest viable diff | PASS | Reuses Phase II Task model, auth, DB, and CORS |
| No hardcoded secrets | PASS | All keys via .env files |
| Stateless server | PASS | Conversation state in DB, not in memory |

## Project Structure

### Documentation (this feature)

```text
specs/003-todo-ai-chatbot/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0: Technology research
├── data-model.md        # Phase 1: Entity definitions
├── quickstart.md        # Phase 1: Setup guide
├── contracts/
│   ├── chat-api.md      # Chat endpoint contract
│   └── mcp-tools.md     # MCP tool contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2: Implementation tasks (via /sp.tasks)
```

### Source Code (repository root)

```text
backend/
├── main.py                  # FastAPI app — add chat router
├── models.py                # Add Conversation, Message models
├── db.py                    # Existing DB setup (auto-creates new tables)
├── auth.py                  # Existing JWT auth (reused)
├── routes/
│   ├── tasks.py             # Existing task REST routes
│   └── chat.py              # NEW: POST /api/{user_id}/chat
├── mcp_server/
│   ├── __init__.py
│   └── server.py            # MCP server with 5 tools
├── agent/
│   ├── __init__.py
│   └── chat_agent.py        # OpenAI Agent config + run_agent()
└── requirements.txt         # Add: openai-agents, mcp, openai

frontend/
├── src/
│   ├── app/
│   │   ├── chat/
│   │   │   └── page.tsx     # NEW: Chat page
│   │   └── ...              # Existing pages
│   ├── components/
│   │   └── ChatInterface.tsx # NEW: Chat UI component
│   └── lib/
│       └── api.ts           # Add: sendMessage() method
├── package.json             # Add: @openai/chatkit-react
└── ...
```

**Structure Decision**: Web application structure (Option 2). Extends existing `backend/` and `frontend/` directories from Phase II. New files are isolated in `mcp_server/`, `agent/`, and `chat/` directories to minimize impact on existing code.

## Architecture

```text
┌─────────────────┐     POST /api/{user_id}/chat     ┌──────────────────────┐
│  ChatKit React   │ ──────────────────────────────► │   FastAPI Backend      │
│  (frontend)      │ ◄────────────────────────────── │                        │
└─────────────────┘       JSON response              │  1. Auth (JWT)         │
                                                      │  2. Fetch/create conv  │
                                                      │  3. Load message hist  │
                                                      │  4. Store user msg     │
                                                      │  5. Run Agent          │
                                                      │  6. Store agent msg    │
                                                      │  7. Return response    │
                                                      └──────────┬─────────────┘
                                                                 │
                                                      ┌──────────▼─────────────┐
                                                      │   OpenAI Agent          │
                                                      │   (Agents SDK)          │
                                                      │                         │
                                                      │   System prompt +       │
                                                      │   conversation history  │
                                                      │   → decides tool calls  │
                                                      └──────────┬─────────────┘
                                                                 │
                                                      ┌──────────▼─────────────┐
                                                      │   MCP Server (stdio)    │
                                                      │   (Official MCP SDK)    │
                                                      │                         │
                                                      │   Tools:                │
                                                      │   • add_task            │
                                                      │   • list_tasks          │
                                                      │   • complete_task       │
                                                      │   • delete_task         │
                                                      │   • update_task         │
                                                      └──────────┬─────────────┘
                                                                 │
                                                      ┌──────────▼─────────────┐
                                                      │   Neon PostgreSQL       │
                                                      │   • tasks (existing)    │
                                                      │   • conversation (new)  │
                                                      │   • message (new)       │
                                                      └────────────────────────┘
```

## Stateless Request Cycle

1. **Receive** user message via `POST /api/{user_id}/chat`
2. **Authenticate** — verify JWT, match user_id
3. **Resolve conversation** — fetch existing or create new
4. **Load history** — fetch all Messages for this conversation from DB
5. **Store user message** — persist to Message table (role="user")
6. **Build messages** — format history + new message for Agent
7. **Run Agent** — OpenAI Agents SDK processes with MCP tools available
8. **Agent executes tools** — MCP server handles tool calls against DB
9. **Store assistant message** — persist response to Message table (role="assistant")
10. **Return** — `{conversation_id, response, tool_calls}`
11. **Server holds NO state** — ready for next request

## Complexity Tracking

> No constitution violations — all choices are minimal and justified.

| Decision | Justification |
|---|---|
| MCP server (vs direct function tools) | Required by spec; adds standardization benefit |
| Separate agent/ and mcp_server/ dirs | Clean separation of concerns; minimal complexity |
| ChatKit (vs custom chat UI) | Required by spec; reduces frontend effort |
