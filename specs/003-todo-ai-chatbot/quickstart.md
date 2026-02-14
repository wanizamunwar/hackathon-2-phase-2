# Quickstart: Todo AI Chatbot

**Feature Branch**: `003-todo-ai-chatbot`

## Prerequisites

- Python 3.12+ with pip
- Node.js 18+ with npm
- Neon PostgreSQL database (from Phase II)
- OpenAI API key
- Phase II backend and frontend running

## Backend Setup

```bash
cd backend

# Install new dependencies
pip install openai-agents mcp openai

# Add OPENAI_API_KEY to .env
echo "OPENAI_API_KEY=sk-your-key-here" >> .env

# Run the backend
uvicorn main:app --reload --port 8000
```

## Frontend Setup

```bash
cd frontend

# Install ChatKit
npm install @openai/chatkit-react

# Run the frontend
npm run dev
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
OPENAI_API_KEY=sk-your-key-here
```

### Frontend (.env)
```
BETTER_AUTH_SECRET=...
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://...
```

## Test the Chat

1. Start backend: `cd backend && uvicorn main:app --reload --port 8000`
2. Start frontend: `cd frontend && npm run dev`
3. Open `http://localhost:3000/chat`
4. Sign in with your account
5. Type "Add a task to buy groceries" and verify the AI creates the task
6. Type "Show me all my tasks" and verify the task list appears

## API Test (curl)

```bash
# Get JWT token by signing in via the frontend first, then:
curl -X POST http://localhost:8000/api/{user_id}/chat \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a task to buy groceries"}'
```
