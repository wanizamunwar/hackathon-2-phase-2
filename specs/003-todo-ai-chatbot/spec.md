# Feature Specification: Todo AI Chatbot

**Feature Branch**: `003-todo-ai-chatbot`
**Created**: 2026-02-10
**Status**: Draft
**Input**: User description: "Phase III: Todo AI Chatbot — AI-powered chatbot interface for managing todos through natural language using MCP (Model Context Protocol) server architecture, OpenAI Agents SDK, and OpenAI ChatKit frontend."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Task via Natural Language (Priority: P1)

A user opens the chat interface, types "Add a task to buy groceries", and the AI assistant creates the task and confirms it with a friendly message including the task title and ID.

**Why this priority**: Task creation is the most fundamental operation. Without it, no other task management features have value. This validates the entire AI-to-MCP-tool pipeline end to end.

**Independent Test**: Open the chat page, type "I need to remember to pay bills", verify the assistant confirms creation and the task appears in the database.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the chat page, **When** they type "Add a task to buy groceries", **Then** the system creates a task titled "Buy groceries" and the assistant confirms with task ID and title.
2. **Given** a user types "I need to remember to pay bills", **When** the message is sent, **Then** the system infers intent to create a task titled "Pay bills" and confirms creation.
3. **Given** a user types "Add task buy milk with description get 2% milk from store", **When** processed, **Then** the task is created with both title and description populated.

---

### User Story 2 - List Tasks via Natural Language (Priority: P1)

A user asks "Show me all my tasks" or "What's pending?" and the AI assistant retrieves and displays their tasks in a readable format, filtered by the requested status.

**Why this priority**: Viewing tasks is essential for users to know what they have and decide what to manage next. Combined with US1, this forms a complete basic workflow.

**Independent Test**: Create several tasks (some completed), then ask "What's pending?" and verify only incomplete tasks are shown.

**Acceptance Scenarios**:

1. **Given** a user with 5 tasks (3 pending, 2 completed), **When** they ask "Show me all my tasks", **Then** all 5 tasks are listed with their status.
2. **Given** the same user, **When** they ask "What's pending?", **Then** only the 3 pending tasks are shown.
3. **Given** the same user, **When** they ask "What have I completed?", **Then** only the 2 completed tasks are shown.
4. **Given** a user with no tasks, **When** they ask "Show my tasks", **Then** the assistant responds that no tasks were found.

---

### User Story 3 - Complete a Task via Natural Language (Priority: P1)

A user says "Mark task 3 as complete" or "I finished buying groceries" and the AI assistant marks the appropriate task as done and confirms the action.

**Why this priority**: Task completion closes the loop on the task lifecycle and is core to the todo management value proposition.

**Independent Test**: Create a task, note its ID, say "Mark task [ID] as complete", verify the task status changes to completed.

**Acceptance Scenarios**:

1. **Given** a user with pending task ID 3, **When** they say "Mark task 3 as complete", **Then** task 3 is marked completed and the assistant confirms.
2. **Given** a user says "I finished task 3", **When** processed, **Then** the system infers completion intent and marks the task done.
3. **Given** a user says "Complete task 9999" (non-existent), **When** processed, **Then** the assistant responds gracefully that the task was not found.

---

### User Story 4 - Delete a Task via Natural Language (Priority: P2)

A user says "Delete task 2" or "Remove the old task" and the AI assistant deletes the specified task and confirms removal.

**Why this priority**: Deletion is important for task hygiene but less frequently used than creation, listing, or completion.

**Independent Test**: Create a task, say "Delete task [ID]", verify the task is removed from the database.

**Acceptance Scenarios**:

1. **Given** a user with task ID 2, **When** they say "Delete task 2", **Then** the task is deleted and the assistant confirms with the task title.
2. **Given** a user says "Remove the meeting task", **When** processed, **Then** the assistant lists matching tasks and deletes the correct one.
3. **Given** a user says "Delete task 9999", **When** processed, **Then** the assistant responds that the task was not found.

---

### User Story 5 - Update a Task via Natural Language (Priority: P2)

A user says "Change task 1 to 'Call mom tonight'" and the AI assistant updates the task title or description and confirms the change.

**Why this priority**: Task updates allow users to refine their tasks, but this is a less common action than creation or completion.

**Independent Test**: Create a task, say "Change task [ID] to 'Updated title'", verify the title is updated.

**Acceptance Scenarios**:

1. **Given** a user with task ID 1 titled "Call mom", **When** they say "Change task 1 to 'Call mom tonight'", **Then** the title is updated and the assistant confirms.
2. **Given** a user says "Update the description of task 1 to 'Call after 8pm'", **When** processed, **Then** the description is updated.

---

### User Story 6 - Conversation Persistence Across Sessions (Priority: P1)

A user has an ongoing conversation, the server restarts, and the user resumes the conversation. All previous messages and context are preserved because conversation state is persisted to the database.

**Why this priority**: Stateless server with DB-persisted conversations is a core architectural requirement. Without this, users lose context on every server restart, destroying the chat experience.

**Independent Test**: Send several messages in a conversation, note the conversation_id. Restart the server. Send a new message with the same conversation_id and verify the AI has full context of prior messages.

**Acceptance Scenarios**:

1. **Given** a user with conversation_id 5 containing 10 messages, **When** the server restarts and the user sends a new message with conversation_id 5, **Then** the AI responds with full context of the previous 10 messages.
2. **Given** a user sends a message without a conversation_id, **When** processed, **Then** a new conversation is created and the conversation_id is returned.

---

### User Story 7 - Multi-Tool Chaining in One Turn (Priority: P2)

A user says "Delete the meeting task" (without specifying an ID). The AI first lists tasks to find the matching one, then deletes it — chaining multiple MCP tool calls in a single turn.

**Why this priority**: Real-world usage often requires the AI to compose multiple actions. This demonstrates the agent's ability to reason and chain tools.

**Independent Test**: Create a task titled "Team meeting". Say "Delete the meeting task". Verify the AI finds and deletes the correct task without asking for an ID.

**Acceptance Scenarios**:

1. **Given** a user with a task titled "Team meeting", **When** they say "Delete the meeting task", **Then** the AI calls list_tasks, identifies the matching task, calls delete_task, and confirms deletion.
2. **Given** multiple tasks with "meeting" in the title, **When** the user says "Delete the meeting task", **Then** the AI lists the matches and asks which one to delete.

---

### Edge Cases

- What happens when the user sends an empty message? The system should respond with a helpful prompt.
- What happens when the AI cannot determine the user's intent? The assistant should ask for clarification rather than guessing incorrectly.
- What happens when the database is temporarily unavailable? The assistant should return a friendly error message.
- What happens when a user tries to manage another user's tasks? The system should enforce user isolation and deny access.
- What happens when a conversation has a very long history (100+ messages)? The system should handle it without timeout or memory issues.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a single chat endpoint that accepts natural language messages and returns AI-generated responses with tool call details.
- **FR-002**: System MUST expose five MCP tools: add_task, list_tasks, complete_task, delete_task, and update_task.
- **FR-003**: System MUST persist all conversation messages (user and assistant) to the database.
- **FR-004**: System MUST create a new conversation when no conversation_id is provided, and resume existing conversations when one is provided.
- **FR-005**: System MUST maintain a fully stateless server — no in-memory conversation state between requests.
- **FR-006**: System MUST authenticate all chat requests using JWT tokens (existing Phase II auth).
- **FR-007**: System MUST scope all task operations to the authenticated user — no cross-user data access.
- **FR-008**: System MUST return the conversation_id, assistant response text, and list of tool calls in every chat response.
- **FR-009**: The AI agent MUST confirm all task actions (creation, completion, deletion, update) with a friendly natural language response.
- **FR-010**: The AI agent MUST gracefully handle errors (task not found, invalid input) with user-friendly messages instead of raw error codes.
- **FR-011**: System MUST provide a conversational chat UI where users can type messages and see AI responses in real time.

### Key Entities

- **Task**: Represents a todo item. Attributes: user_id, title, description, completed status, timestamps. Reused from Phase II.
- **Conversation**: Represents a chat session. Attributes: user_id, timestamps. A user can have multiple conversations.
- **Message**: Represents a single message in a conversation. Attributes: user_id, conversation_id, role (user or assistant), content, timestamp. Each conversation contains an ordered sequence of messages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create, list, complete, update, and delete tasks entirely through natural language chat — no forms or buttons required.
- **SC-002**: The chatbot correctly interprets and routes at least 8 distinct natural language command patterns (as defined in the NL command mapping) to the appropriate MCP tool.
- **SC-003**: Conversations persist across server restarts — users can resume any prior conversation and the AI retains full context.
- **SC-004**: The assistant responds to each message within 10 seconds, including MCP tool execution time.
- **SC-005**: All task operations are scoped to the authenticated user — no user can view or modify another user's tasks via chat.
- **SC-006**: The chat UI displays a clear message thread with distinct user and assistant messages.
- **SC-007**: Error scenarios (non-existent task, empty message, ambiguous intent) produce friendly, helpful responses — never raw errors or crashes.

## Assumptions

- Users are authenticated via the existing Phase II Better Auth + JWT system.
- The existing Task table from Phase II is reused without schema changes.
- OpenAI API access is available with a valid API key.
- The Neon PostgreSQL database from Phase II is reused for new Conversation and Message tables.
- The MCP server runs in-process with the FastAPI backend (not as a separate service).
