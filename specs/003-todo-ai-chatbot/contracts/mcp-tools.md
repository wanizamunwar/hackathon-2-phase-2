# API Contract: MCP Tools

**Feature Branch**: `003-todo-ai-chatbot`

## Tool: add_task

| Field | Value |
|---|---|
| Purpose | Create a new task |
| Parameters | user_id (string, required), title (string, required), description (string, optional) |
| Returns | `{task_id: int, status: "created", title: string}` |

**Example**:
- Input: `{"user_id": "abc123", "title": "Buy groceries", "description": "Milk, eggs, bread"}`
- Output: `{"task_id": 5, "status": "created", "title": "Buy groceries"}`

---

## Tool: list_tasks

| Field | Value |
|---|---|
| Purpose | Retrieve tasks filtered by status |
| Parameters | user_id (string, required), status (string, optional: "all", "pending", "completed") |
| Returns | Array of `{id: int, title: string, completed: boolean}` |

**Example**:
- Input: `{"user_id": "abc123", "status": "pending"}`
- Output: `[{"id": 1, "title": "Buy groceries", "completed": false}, {"id": 2, "title": "Call mom", "completed": false}]`

---

## Tool: complete_task

| Field | Value |
|---|---|
| Purpose | Mark a task as complete |
| Parameters | user_id (string, required), task_id (integer, required) |
| Returns | `{task_id: int, status: "completed", title: string}` |
| Errors | Task not found → `{"error": "Task not found"}` |

**Example**:
- Input: `{"user_id": "abc123", "task_id": 3}`
- Output: `{"task_id": 3, "status": "completed", "title": "Call mom"}`

---

## Tool: delete_task

| Field | Value |
|---|---|
| Purpose | Remove a task from the list |
| Parameters | user_id (string, required), task_id (integer, required) |
| Returns | `{task_id: int, status: "deleted", title: string}` |
| Errors | Task not found → `{"error": "Task not found"}` |

**Example**:
- Input: `{"user_id": "abc123", "task_id": 2}`
- Output: `{"task_id": 2, "status": "deleted", "title": "Old task"}`

---

## Tool: update_task

| Field | Value |
|---|---|
| Purpose | Modify task title or description |
| Parameters | user_id (string, required), task_id (integer, required), title (string, optional), description (string, optional) |
| Returns | `{task_id: int, status: "updated", title: string}` |
| Errors | Task not found → `{"error": "Task not found"}` |

**Example**:
- Input: `{"user_id": "abc123", "task_id": 1, "title": "Buy groceries and fruits"}`
- Output: `{"task_id": 1, "status": "updated", "title": "Buy groceries and fruits"}`
