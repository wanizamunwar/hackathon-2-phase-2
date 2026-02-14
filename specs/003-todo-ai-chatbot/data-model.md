# Data Model: Todo AI Chatbot

**Feature Branch**: `003-todo-ai-chatbot`
**Date**: 2026-02-10

## Entities

### Task (existing — reused from Phase II)

| Attribute | Type | Constraints |
|---|---|---|
| id | integer | primary key, auto-increment |
| user_id | string | required, indexed |
| title | string | required, max 200 chars |
| description | string | optional, max 1000 chars |
| completed | boolean | default: false |
| priority | string | default: "medium", enum: low/medium/high |
| tags | string[] | default: [] |
| created_at | datetime | auto-set on create |
| updated_at | datetime | auto-set on update |

**Notes**: No schema changes. MCP tools operate on this table via SQLModel.

---

### Conversation (new)

| Attribute | Type | Constraints |
|---|---|---|
| id | integer | primary key, auto-increment |
| user_id | string | required, indexed |
| created_at | datetime | auto-set on create |
| updated_at | datetime | auto-set on update |

**Relationships**:
- One Conversation → many Messages (1:N)
- One User → many Conversations (1:N)

**Validation Rules**:
- `user_id` must not be empty
- Created automatically when a user sends a message without `conversation_id`

---

### Message (new)

| Attribute | Type | Constraints |
|---|---|---|
| id | integer | primary key, auto-increment |
| user_id | string | required, indexed |
| conversation_id | integer | required, foreign key → Conversation.id, indexed |
| role | string | required, enum: "user" or "assistant" |
| content | string | required, must not be empty |
| created_at | datetime | auto-set on create |

**Relationships**:
- Many Messages → one Conversation (N:1)

**Validation Rules**:
- `role` must be "user" or "assistant"
- `conversation_id` must reference an existing Conversation owned by the same user
- `content` must not be empty
- Messages are ordered by `created_at` ascending within a conversation

---

## Entity Relationship Diagram

```
User (external — Better Auth)
 │
 ├── 1:N ──► Task
 │
 └── 1:N ──► Conversation
                │
                └── 1:N ──► Message
```

---

## State Transitions

### Task.completed
```
false (pending) ──► true (completed)   via complete_task MCP tool
```

### Conversation lifecycle
```
[not exists] ──► created   when first message sent without conversation_id
created ──► active         when messages are exchanged
```

### Message lifecycle
```
[not exists] ──► created   stored immediately when user sends or agent responds
```

---

## MCP Tool Return Schemas

### add_task
```json
{"task_id": 5, "status": "created", "title": "Buy groceries"}
```

### list_tasks
```json
[{"id": 1, "title": "Buy groceries", "completed": false}, ...]
```

### complete_task
```json
{"task_id": 3, "status": "completed", "title": "Call mom"}
```

### delete_task
```json
{"task_id": 2, "status": "deleted", "title": "Old task"}
```

### update_task
```json
{"task_id": 1, "status": "updated", "title": "Buy groceries and fruits"}
```
