# Research: Todo AI Chatbot

**Feature Branch**: `003-todo-ai-chatbot`
**Date**: 2026-02-10

## Technology Decisions

### Decision 1: AI Agent Framework — OpenAI Agents SDK

- **Decision**: Use `openai-agents` Python package
- **Rationale**: Specified in requirements. Native MCP integration via `MCPServerStdio` and `MCPServerStreamableHttp`. Built-in tool routing, schema validation, and multi-turn support.
- **Alternatives considered**:
  - LangChain Agents — heavier, more complex setup
  - Raw OpenAI function calling — no MCP integration, manual tool dispatch
- **Install**: `pip install openai-agents`
- **Key pattern**: `Agent(name=..., instructions=..., mcp_servers=[server])` + `Runner.run(agent, messages)`

### Decision 2: MCP Server — Official MCP SDK (Python)

- **Decision**: Use `mcp` Python package to build an in-process MCP server exposing 5 task management tools
- **Rationale**: Specified in requirements. Standardized protocol for AI-to-tool communication. The OpenAI Agents SDK has built-in MCP client support.
- **Alternatives considered**:
  - Custom function tools (no MCP) — doesn't meet MCP requirement
  - Remote MCP server — unnecessary complexity for single-process deployment
- **Install**: `pip install mcp`
- **Transport**: stdio (in-process) for local dev; streamable HTTP for production flexibility
- **Key pattern**: Define tools with `@server.tool()` decorator, each tool reads/writes to the database

### Decision 3: Frontend Chat UI — OpenAI ChatKit

- **Decision**: Use `@openai/chatkit-react` for the chat interface
- **Rationale**: Specified in requirements. Drop-in chat component with streaming, theming, and tool visualization support.
- **Alternatives considered**:
  - Custom React chat UI — more work, less polished
  - Vercel AI SDK chat — good but doesn't meet ChatKit requirement
- **Install**: `npm install @openai/chatkit-react`
- **Key pattern**: `<ChatKit control={control} />` with `useChatKit({ api: { url, domainKey } })`
- **Note**: ChatKit connects to a backend runtime endpoint. We need to either use OpenAI's hosted runtime or build a custom streaming endpoint that ChatKit understands.

### Decision 4: MCP Server Transport for Agent Integration

- **Decision**: Use `MCPServerStdio` for in-process MCP server communication
- **Rationale**: Simplest transport for same-process communication. The MCP server runs as a subprocess managed by the Agents SDK. No network overhead.
- **Alternatives considered**:
  - `MCPServerStreamableHttp` — adds HTTP overhead unnecessarily for same-machine deployment
  - `HostedMCPTool` — requires OpenAI-hosted MCP, not self-hosted
- **Key pattern**:
  ```python
  async with MCPServerStdio(
      name="Todo MCP Server",
      params={"command": "python", "args": ["mcp_server/server.py"]},
  ) as server:
      agent = Agent(name="Todo Assistant", mcp_servers=[server])
  ```

### Decision 5: ChatKit Backend Integration Approach

- **Decision**: Build a custom chat API endpoint (`POST /api/{user_id}/chat`) that the frontend calls directly, rather than using ChatKit's built-in OpenAI runtime connection.
- **Rationale**: ChatKit's hosted runtime requires an OpenAI-managed agent workflow. Our requirements specify a custom FastAPI backend with MCP tools and conversation persistence. The frontend will use a custom chat component that calls our API and displays responses in a ChatKit-styled thread.
- **Alternatives considered**:
  - ChatKit hosted runtime — ties to OpenAI's infrastructure, no custom MCP server control
  - ChatKit with proxy — adds unnecessary layer
- **Key pattern**: Frontend sends messages to our FastAPI endpoint, receives responses, and renders them in a chat UI using ChatKit's Thread and Message components for styling.

## Unresolved Items

None — all technology choices are specified in the requirements or resolved through research above.

## References

- [OpenAI Agents SDK — MCP Integration](https://openai.github.io/openai-agents-python/mcp/)
- [OpenAI Agents SDK — Main Docs](https://openai.github.io/openai-agents-python/)
- [OpenAI ChatKit Quick Start](https://openai.github.io/chatkit-js/quickstart/)
- [OpenAI ChatKit React](https://www.npmjs.com/package/@openai/chatkit-react)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
