---
id: 004
title: Implement Todo AI Chatbot
stage: green
date: 2026-02-10
surface: agent
model: claude-opus-4-6
feature: 003-todo-ai-chatbot
branch: 003-todo-ai-chatbot
user: architect
command: /sp.implement
labels: ["implementation", "mcp", "openai-agents", "chatbot", "full-stack"]
links:
  spec: specs/003-todo-ai-chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - backend/requirements.txt
  - backend/models.py
  - backend/main.py
  - backend/mcp_server/__init__.py
  - backend/mcp_server/server.py
  - backend/agent/__init__.py
  - backend/agent/chat_agent.py
  - backend/routes/chat.py
  - backend/.env.example
  - frontend/src/lib/api.ts
  - frontend/src/components/ChatInterface.tsx
  - frontend/src/app/chat/page.tsx
  - frontend/src/app/dashboard/page.tsx
  - specs/003-todo-ai-chatbot/tasks.md
tests:
  - Frontend build: PASS (next build compiles with /chat route)
  - Backend imports: PASS (all modules import correctly)
  - Route registration: PASS (/api/{user_id}/chat registered in FastAPI)
  - MCP server module: PASS (mcp_server.server importable)
---

## Prompt

/sp.implement

(No additional user input — executed all 20 tasks from tasks.md across 11 phases.)

## Response snapshot

Implemented the complete Todo AI Chatbot feature across 20 tasks in 11 phases:

**Backend (7 new/modified files):**
- `backend/models.py` — Added Conversation, Message, ChatRequest, ChatResponse models
- `backend/mcp_server/server.py` — FastMCP server with 5 tools (add_task, list_tasks, complete_task, delete_task, update_task)
- `backend/agent/chat_agent.py` — OpenAI Agents SDK integration with MCPServerStdio, system prompt with multi-tool chaining
- `backend/routes/chat.py` — POST /api/{user_id}/chat endpoint (stateless request cycle with conversation persistence)
- `backend/main.py` — Registered chat router
- `backend/requirements.txt` — Added openai-agents, mcp, openai
- `backend/.env.example` — Added OPENAI_API_KEY

**Frontend (4 new/modified files):**
- `frontend/src/lib/api.ts` — Added sendMessage(), ChatResponse, ChatMessage types
- `frontend/src/components/ChatInterface.tsx` — Custom Tailwind chat UI (ChatKit requires incompatible backend protocol)
- `frontend/src/app/chat/page.tsx` — Chat page with auth guard
- `frontend/src/app/dashboard/page.tsx` — Added "AI Chat" navigation button

**Validation:** Frontend builds clean (next build PASS), all backend imports resolve, /api/{user_id}/chat route registered.

## Outcome

- ✅ Impact: Full-stack AI chatbot feature implemented — 7 user stories, 5 MCP tools, stateless architecture
- 🧪 Tests: Build validation + import verification passed; runtime testing requires OPENAI_API_KEY
- 📁 Files: 11 files created/modified (7 backend, 4 frontend)
- 🔁 Next prompts: Add OPENAI_API_KEY to backend/.env, run backend + frontend, test end-to-end via /chat page
- 🧠 Reflection: ChatKit React requires ChatKit backend protocol (not compatible with custom API) — used custom Tailwind chat UI instead. MCP server subprocess pattern via MCPServerStdio works well for stateless architecture.

## Evaluation notes (flywheel)

- Failure modes observed: @openai/chatkit-react is monolithic widget requiring specific backend protocol, not composable components — pivoted to custom UI
- Graders run and results (PASS/FAIL): Frontend build PASS, Backend imports PASS, Route registration PASS
- Prompt variant (if applicable): Standard /sp.implement workflow
- Next experiment: Consider streaming responses via SSE for better UX on slow AI responses
