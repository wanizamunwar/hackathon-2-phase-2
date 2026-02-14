# API Contract: Chat Endpoint

**Feature Branch**: `003-todo-ai-chatbot`

## POST `/api/{user_id}/chat`

### Description
Send a natural language message and receive an AI-generated response with MCP tool call details.

### Authentication
- Header: `Authorization: Bearer <jwt_token>`
- JWT `sub` claim must match `{user_id}` path parameter

### Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| user_id | string | yes | Authenticated user's ID |

### Request Body

```json
{
  "conversation_id": 123,
  "message": "Add a task to buy groceries"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| conversation_id | integer | no | Existing conversation ID. Creates new conversation if omitted. |
| message | string | yes | User's natural language message. Must not be empty. |

### Response (200 OK)

```json
{
  "conversation_id": 123,
  "response": "I've created a new task 'Buy groceries' for you!",
  "tool_calls": [
    {
      "tool": "add_task",
      "input": {"user_id": "abc123", "title": "Buy groceries"},
      "output": {"task_id": 5, "status": "created", "title": "Buy groceries"}
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| conversation_id | integer | The conversation ID (new or existing) |
| response | string | AI assistant's natural language response |
| tool_calls | array | List of MCP tools invoked during this turn |

### Tool Call Object

| Field | Type | Description |
|---|---|---|
| tool | string | MCP tool name (add_task, list_tasks, complete_task, delete_task, update_task) |
| input | object | Parameters passed to the tool |
| output | object | Tool execution result |

### Error Responses

| Status | Condition | Body |
|---|---|---|
| 400 | Empty message | `{"detail": "Message cannot be empty"}` |
| 401 | Missing/invalid JWT | `{"detail": "Invalid token"}` |
| 403 | user_id mismatch | `{"detail": "Access denied"}` |
| 404 | conversation_id not found | `{"detail": "Conversation not found"}` |
| 500 | Agent/MCP error | `{"detail": "Failed to process message"}` |

### Idempotency
- Not idempotent — each request creates new Message records
- Clients should not retry on success

### Rate Limiting
- No explicit rate limit (relies on OpenAI API rate limits)

### Timeouts
- Client should allow up to 30 seconds for response (AI + MCP tool execution time)
