---
id: 004
title: Research chatkit-react npm package
stage: misc
date: 2026-02-10
surface: agent
model: claude-opus-4-6
feature: 003-todo-ai-chatbot
branch: 003-todo-ai-chatbot
user: developer
command: research
labels: ["chatkit-react", "openai", "npm", "research", "chat-ui"]
links:
  spec: specs/003-todo-ai-chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - history/prompts/003-todo-ai-chatbot/004-research-chatkit-react-package.misc.prompt.md
tests:
  - none
---

## Prompt

Research the @openai/chatkit-react npm package and return the exact code patterns for building a chat UI. I need:

1. What components are available (Thread, Message, etc.)
2. How to render a message thread with user and assistant messages
3. How to create a chat input field
4. The correct imports and basic usage

Search the web and check https://openai.github.io/chatkit-js/ and https://www.npmjs.com/package/@openai/chatkit-react

Return exact imports and JSX code examples for a custom chat interface that sends messages to a custom API endpoint (not OpenAI directly).

## Response snapshot

Comprehensive research completed. Key finding: @openai/chatkit-react exports only two items -- ChatKit component and useChatKit hook. It does NOT expose granular components like Thread, Message, or ChatInput. It is a monolithic widget that renders the entire chat UI internally. Customization is done via configuration options (theme, composer, header, history, startScreen) and imperative methods (sendUserMessage, setThreadId, setComposerValue, etc.). The self-hosted pattern uses api.url and api.domainKey configuration. The backend must implement the ChatKit API protocol.

## Outcome

- Impact: Research informs implementation approach for chat UI feature
- Tests: none
- Files: PHR created
- Next prompts: Decide whether to use chatkit-react (requires ChatKit protocol backend) or build custom chat UI
- Reflection: chatkit-react is tightly coupled to OpenAI's ChatKit backend protocol; may not be suitable for arbitrary custom API endpoints

## Evaluation notes (flywheel)

- Failure modes observed: npm page returned 403; several documentation pages returned 404 or 403; rate limiting on some blog sites
- Graders run and results (PASS/FAIL): PASS - comprehensive API surface documented
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): none
