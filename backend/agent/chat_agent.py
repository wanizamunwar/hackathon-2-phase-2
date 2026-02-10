import json
import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# Ensure .env is loaded even if imported before main.py's load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from agents import Agent, Runner
from agents.mcp import MCPServerStdio
from agents.items import ToolCallItem, ToolCallOutputItem

logger = logging.getLogger(__name__)

BACKEND_DIR = str(Path(__file__).parent.parent)


def _build_instructions(user_id: str) -> str:
    return (
        "You are a helpful todo management assistant. You help users manage "
        "their tasks through natural language conversation.\n\n"
        f"The current user's ID is: {user_id}\n"
        "Always pass this user_id when calling any tool.\n\n"
        "Available actions:\n"
        "- Create tasks: Use add_task tool\n"
        "- List tasks: Use list_tasks tool (supports filtering by status)\n"
        "- Complete tasks: Use complete_task tool\n"
        "- Delete tasks: Use delete_task tool\n"
        "- Update tasks: Use update_task tool\n\n"
        "Guidelines:\n"
        "- Always confirm actions with a friendly, natural message\n"
        "- Include task IDs and titles in your confirmations\n"
        "- If a task is not found, inform the user gracefully\n"
        "- If the user's intent is unclear, ask for clarification\n"
        "- For greetings or general questions, respond conversationally\n\n"
        "Multi-step reasoning:\n"
        "- When the user refers to a task by name or description instead of ID, "
        "first call list_tasks to find matching tasks, then perform the requested "
        "action on the match.\n"
        "- Example: 'Delete the meeting task' → call list_tasks to find tasks "
        "with 'meeting' in the title, then call delete_task with the matching ID.\n"
        "- If multiple tasks match, list them and ask the user which one they mean.\n"
        "- You can chain multiple tool calls in a single turn when needed.\n"
    )


async def run_agent(user_id: str, messages: list[dict]) -> dict:
    """Run the AI agent with MCP tools and return the response.

    Args:
        user_id: The authenticated user's ID (passed to tools for scoping).
        messages: Conversation history as list of {"role": ..., "content": ...}.

    Returns:
        Dict with "response" (str) and "tool_calls" (list of tool call dicts).
    """
    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY environment variable is not set")

    logger.info("Starting MCP server subprocess from %s", BACKEND_DIR)

    async with MCPServerStdio(
        name="Todo MCP Server",
        params={
            "command": sys.executable,
            "args": ["-m", "mcp_server.server"],
            "cwd": BACKEND_DIR,
            "env": {**os.environ},
        },
    ) as server:
        agent = Agent(
            name="Todo Assistant",
            instructions=_build_instructions(user_id),
            mcp_servers=[server],
        )

        logger.info("Running agent with %d messages", len(messages))
        result = await Runner.run(agent, messages)

        tool_calls = []
        for item in result.new_items:
            if isinstance(item, ToolCallItem):
                try:
                    input_data = json.loads(item.raw_item.arguments) if item.raw_item.arguments else {}
                except (json.JSONDecodeError, TypeError):
                    input_data = {}
                tool_calls.append({
                    "tool": item.raw_item.name,
                    "input": input_data,
                    "output": None,
                })
            elif isinstance(item, ToolCallOutputItem):
                if tool_calls and tool_calls[-1]["output"] is None:
                    try:
                        tool_calls[-1]["output"] = json.loads(item.output)
                    except (json.JSONDecodeError, TypeError):
                        tool_calls[-1]["output"] = item.output

        return {
            "response": result.final_output or "",
            "tool_calls": tool_calls,
        }
