# Tasks: Todo AI Chatbot

**Input**: Design documents from `/specs/003-todo-ai-chatbot/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested in feature specification. No test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/` (FastAPI), `frontend/` (Next.js)
- Extends existing Phase II project structure per plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new dependencies and create package directories for the AI chatbot feature

- [x] T001 Add openai-agents, mcp, and openai packages to backend/requirements.txt
- [x] T002 [P] Install @openai/chatkit-react package in frontend/package.json
- [x] T003 [P] Create backend/mcp_server/ and backend/agent/ package directories with __init__.py files

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core models, MCP server skeleton, and agent configuration that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Add Conversation and Message SQLModel models to backend/models.py per data-model.md (Conversation: id, user_id, created_at, updated_at; Message: id, user_id, conversation_id as FK, role enum user/assistant, content, created_at)
- [x] T005 [P] Create MCP server with FastMCP instance, DB engine setup via DATABASE_URL env var, and __main__ entry point in backend/mcp_server/server.py (no tools yet — skeleton only, must be runnable as subprocess via `python -m mcp_server.server`)
- [x] T006 [P] Create agent configuration with Agent definition (name="Todo Assistant", system prompt for task management, instructions to confirm actions with friendly messages), MCPServerStdio setup pointing to mcp_server/server.py, and async run_agent(messages, mcp_server) function in backend/agent/chat_agent.py

**Checkpoint**: Foundation ready — models exist, MCP server runnable as subprocess, agent configured. User story implementation can now begin.

---

## Phase 3: User Story 6 — Conversation Persistence Across Sessions (Priority: P1)

**Goal**: Stateless chat endpoint that persists all conversation state to DB. Server can restart without losing context. New conversations are created when no conversation_id is provided; existing conversations resume when conversation_id is sent.

**Independent Test**: Send several messages via POST /api/{user_id}/chat, note the conversation_id. Restart the backend. Send a new message with the same conversation_id and verify the AI responds with full context of prior messages.

### Implementation for User Story 6

- [x] T007 [US6] Implement POST /api/{user_id}/chat endpoint in backend/routes/chat.py with full stateless request cycle per chat-api.md contract: validate JWT via get_current_user + verify_user_access, validate message not empty (400), resolve conversation (create new if no conversation_id, fetch existing with 404 if not found, verify conversation belongs to user), load all Messages for conversation ordered by created_at, store user message (role="user"), build OpenAI-format messages list from history, invoke run_agent() from agent/chat_agent.py, extract tool_calls from agent response, store assistant message (role="assistant"), return {conversation_id, response, tool_calls} as JSON
- [x] T008 [US6] Register chat router in backend/main.py by importing routes.chat router and adding app.include_router(chat_router) alongside existing tasks_router

**Checkpoint**: Chat endpoint functional — conversations persist to DB, messages are stored and loaded from history. Can test with curl (agent will respond but has no MCP tools yet).

---

## Phase 4: User Story 1 — Create Task via Natural Language (Priority: P1) 🎯 MVP

**Goal**: User types "Add a task to buy groceries" and the AI creates the task via the add_task MCP tool and confirms with task ID and title.

**Independent Test**: Open a chat session, type "I need to remember to pay bills", verify the assistant confirms creation and the task appears in the database.

### Implementation for User Story 1

- [x] T009 [US1] Implement add_task MCP tool in backend/mcp_server/server.py per mcp-tools.md contract: parameters user_id (str, required), title (str, required), description (str, optional); creates Task in DB via SQLModel session, returns {task_id, status: "created", title}; scoped to user_id

**Checkpoint**: End-to-end flow works — user sends chat message → agent calls add_task → task created in DB → assistant confirms. This is the MVP.

---

## Phase 5: User Story 2 — List Tasks via Natural Language (Priority: P1)

**Goal**: User asks "Show me all my tasks" or "What's pending?" and the AI retrieves and displays their tasks filtered by status.

**Independent Test**: Create several tasks (some completed), then ask "What's pending?" and verify only incomplete tasks are shown.

### Implementation for User Story 2

- [x] T010 [US2] Implement list_tasks MCP tool in backend/mcp_server/server.py per mcp-tools.md contract: parameters user_id (str, required), status (str, optional: "all"/"pending"/"completed", default "all"); queries Tasks filtered by user_id and completed status, returns array of {id, title, completed}

**Checkpoint**: Users can create and list tasks via chat. Two core operations working.

---

## Phase 6: User Story 3 — Complete a Task via Natural Language (Priority: P1)

**Goal**: User says "Mark task 3 as complete" or "I finished buying groceries" and the AI marks the task as done and confirms.

**Independent Test**: Create a task, note its ID, say "Mark task [ID] as complete", verify the task status changes to completed.

### Implementation for User Story 3

- [x] T011 [US3] Implement complete_task MCP tool in backend/mcp_server/server.py per mcp-tools.md contract: parameters user_id (str, required), task_id (int, required); finds Task by id and user_id, sets completed=True, returns {task_id, status: "completed", title}; returns {error: "Task not found"} if not found or wrong user

**Checkpoint**: Full P1 task lifecycle via chat — create, list, complete. Core value proposition delivered.

---

## Phase 7: User Story 4 — Delete a Task via Natural Language (Priority: P2)

**Goal**: User says "Delete task 2" and the AI removes the task and confirms deletion with the task title.

**Independent Test**: Create a task, say "Delete task [ID]", verify the task is removed from the database.

### Implementation for User Story 4

- [x] T012 [US4] Implement delete_task MCP tool in backend/mcp_server/server.py per mcp-tools.md contract: parameters user_id (str, required), task_id (int, required); finds Task by id and user_id, deletes from DB, returns {task_id, status: "deleted", title}; returns {error: "Task not found"} if not found or wrong user

**Checkpoint**: Users can delete tasks via chat in addition to creating, listing, and completing.

---

## Phase 8: User Story 5 — Update a Task via Natural Language (Priority: P2)

**Goal**: User says "Change task 1 to 'Call mom tonight'" and the AI updates the task title or description and confirms.

**Independent Test**: Create a task, say "Change task [ID] to 'Updated title'", verify the title is updated in the database.

### Implementation for User Story 5

- [x] T013 [US5] Implement update_task MCP tool in backend/mcp_server/server.py per mcp-tools.md contract: parameters user_id (str, required), task_id (int, required), title (str, optional), description (str, optional); finds Task by id and user_id, updates provided fields, returns {task_id, status: "updated", title}; returns {error: "Task not found"} if not found or wrong user

**Checkpoint**: All 5 MCP tools operational — full CRUD via chat. Backend feature complete.

---

## Phase 9: User Story 7 — Multi-Tool Chaining in One Turn (Priority: P2)

**Goal**: User says "Delete the meeting task" (no ID) and the AI chains list_tasks → identify match → delete_task in a single turn.

**Independent Test**: Create a task titled "Team meeting". Say "Delete the meeting task". Verify the AI finds and deletes the correct task without asking for an ID.

### Implementation for User Story 7

- [x] T014 [US7] Enhance agent system prompt in backend/agent/chat_agent.py to explicitly instruct multi-step reasoning: when user references a task by name/description instead of ID, first call list_tasks to find matching tasks, then perform the requested action on the match; if multiple matches, ask the user to clarify which one; include examples of chained tool patterns in the prompt

**Checkpoint**: Agent can chain multiple MCP tool calls in a single turn for ambiguous requests.

---

## Phase 10: Frontend Chat UI

**Purpose**: Conversational chat interface where users can type messages and see AI responses per FR-011

- [x] T015 [P] Add sendMessage() method and ChatResponse/ChatMessage types to frontend/src/lib/api.ts: sendMessage(userId, message, conversationId?) calls POST /api/{user_id}/chat with {message, conversation_id} body, returns {conversation_id, response, tool_calls}
- [x] T016 Create ChatInterface component in frontend/src/components/ChatInterface.tsx with custom Tailwind chat UI (ChatKit requires backend protocol incompatible with our API): maintains messages array in state, stores conversation_id from first response, displays user messages (right-aligned) and assistant messages (left-aligned), includes input field with send button, shows loading state while waiting for response, auto-scrolls to latest message
- [x] T017 Create chat page in frontend/src/app/chat/page.tsx: "use client" directive, auth guard (redirect to /signin if no session via useSession), render ChatInterface with userId from session, include header with "AI Chat" title, link back to dashboard, and sign out button matching dashboard page pattern

**Checkpoint**: Full-stack feature complete — users can manage todos through natural language chat in the browser.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Edge case handling, navigation integration, and end-to-end validation

- [x] T018 [P] Add edge case handling in backend/routes/chat.py: empty message returns 400 per contract, agent errors return 500 with "Failed to process message", log errors for debugging; and update agent system prompt in backend/agent/chat_agent.py to respond helpfully when intent is unclear (ask for clarification) and handle empty/greeting messages gracefully
- [x] T019 [P] Add navigation link to chat page in frontend/src/app/dashboard/page.tsx header: add "AI Chat" link/button next to user name that navigates to /chat, and add "Dashboard" link in frontend/src/app/chat/page.tsx header for back-navigation
- [x] T020 Validate end-to-end flow per quickstart.md: start backend, start frontend, sign in, navigate to /chat, test "Add a task to buy groceries" (US1), test "Show me all my tasks" (US2), test "Mark task [ID] as complete" (US3), verify conversation persists across page refreshes (US6)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US6 — Conversation Persistence (Phase 3)**: Depends on Phase 2 (needs models, MCP server, agent) — BLOCKS all MCP tool stories
- **US1–US5 (Phases 4–8)**: All depend on Phase 3 (chat endpoint must exist). Must be sequential (all modify backend/mcp_server/server.py)
- **US7 — Multi-Tool Chaining (Phase 9)**: Depends on at least US1 + US2 being complete (needs list_tasks + another tool to chain)
- **Frontend (Phase 10)**: Depends on Phase 3 (needs chat endpoint). Can run in parallel with Phases 4–9 backend work
- **Polish (Phase 11)**: Depends on Phases 4–10 being complete

### User Story Dependencies

- **US6 (P1)**: First — builds the chat endpoint infrastructure all stories use
- **US1 (P1)**: After US6 — first MCP tool, enables MVP demo
- **US2 (P1)**: After US1 — second tool, independently testable
- **US3 (P1)**: After US2 — third tool, completes P1 task lifecycle
- **US4 (P2)**: After US3 — fourth tool, starts P2 stories
- **US5 (P2)**: After US4 — fifth tool, all CRUD complete
- **US7 (P2)**: After US2 + any action tool — needs list_tasks for chaining

### Within Each User Story

- Models before services/tools
- MCP tools before agent prompt refinements
- Backend before frontend integration
- Core implementation before edge case handling

### Parallel Opportunities

- T002 and T003 can run in parallel (different projects/directories)
- T005 and T006 can run in parallel (different files: mcp_server/server.py vs agent/chat_agent.py)
- T015 and T016 can run in parallel (different files: api.ts vs ChatInterface.tsx)
- T018 and T019 can run in parallel (different files: backend vs frontend)
- **Phase 10 (Frontend)** can run in parallel with **Phases 4–9 (MCP tools)** since they touch different codebases

---

## Parallel Example: Setup Phase

```bash
# After T001 completes, launch T002 and T003 together:
Task: "Install @openai/chatkit-react package in frontend/package.json"
Task: "Create backend/mcp_server/ and backend/agent/ package directories with __init__.py files"
```

## Parallel Example: Foundational Phase

```bash
# After T004 completes, launch T005 and T006 together:
Task: "Create MCP server skeleton in backend/mcp_server/server.py"
Task: "Create agent configuration in backend/agent/chat_agent.py"
```

## Parallel Example: Frontend + Backend Tools

```bash
# After Phase 3 completes, these can proceed in parallel:
Stream A (Backend): T009 → T010 → T011 → T012 → T013 → T014
Stream B (Frontend): T015 + T016 → T017
```

---

## Implementation Strategy

### MVP First (US6 + US1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US6 — Chat endpoint with conversation persistence
4. Complete Phase 4: US1 — add_task MCP tool
5. **STOP and VALIDATE**: Test creating a task via chat end-to-end
6. Deploy/demo if ready — this is a working MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US6 (chat endpoint) → Infrastructure complete
3. Add US1 (add_task) → Test independently → **MVP!**
4. Add US2 (list_tasks) → Test independently → Can view tasks
5. Add US3 (complete_task) → Test independently → Full lifecycle
6. Add US4 + US5 → Test independently → Full CRUD
7. Add US7 → Test chaining → Agent intelligence
8. Add Frontend → Test in browser → Full-stack demo
9. Polish → Production-ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Phase 3 (chat endpoint) is done:
   - Developer A: MCP tools (Phases 4–9) — sequential, same file
   - Developer B: Frontend chat UI (Phase 10) — independent codebase
3. Both streams converge at Phase 11: Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- All MCP tools are in backend/mcp_server/server.py — must be implemented sequentially to avoid file conflicts
- MCP server runs as subprocess via MCPServerStdio — needs its own DB engine from DATABASE_URL env var
- Agent discovers MCP tools automatically — adding a new tool requires no agent code changes (except US7 prompt enhancement)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
