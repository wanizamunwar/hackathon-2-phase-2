import json
import logging
import os
import sys

from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / ".env")

from mcp.server.fastmcp import FastMCP
from sqlmodel import Session, create_engine, select

from models import Task

logging.basicConfig(level=logging.INFO, stream=sys.stderr)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL:
    logger.error("DATABASE_URL is not set!")

engine = create_engine(DATABASE_URL, echo=False) if DATABASE_URL else None

mcp = FastMCP("Todo MCP Server")


def _check_db():
    if engine is None:
        raise RuntimeError("DATABASE_URL is not configured")


@mcp.tool()
def add_task(user_id: str, title: str, description: str = "") -> str:
    """Create a new task for the user.

    Args:
        user_id: The authenticated user's ID
        title: The task title (required)
        description: Optional task description
    """
    try:
        _check_db()
        with Session(engine) as session:
            task = Task(user_id=user_id, title=title, description=description or None)
            session.add(task)
            session.commit()
            session.refresh(task)
            return json.dumps({"task_id": task.id, "status": "created", "title": task.title})
    except Exception as exc:
        logger.exception("add_task failed")
        return json.dumps({"error": f"Failed to add task: {exc}"})


@mcp.tool()
def list_tasks(user_id: str, status: str = "all") -> str:
    """Retrieve tasks for the user, optionally filtered by status.

    Args:
        user_id: The authenticated user's ID
        status: Filter by status - "all", "pending", or "completed" (default: "all")
    """
    try:
        _check_db()
        with Session(engine) as session:
            statement = select(Task).where(Task.user_id == user_id)
            if status == "pending":
                statement = statement.where(Task.completed == False)  # noqa: E712
            elif status == "completed":
                statement = statement.where(Task.completed == True)  # noqa: E712
            tasks = session.exec(statement).all()
            return json.dumps([
                {"id": t.id, "title": t.title, "completed": t.completed}
                for t in tasks
            ])
    except Exception as exc:
        logger.exception("list_tasks failed")
        return json.dumps({"error": f"Failed to list tasks: {exc}"})


@mcp.tool()
def complete_task(user_id: str, task_id: int) -> str:
    """Mark a task as complete.

    Args:
        user_id: The authenticated user's ID
        task_id: The ID of the task to complete
    """
    try:
        _check_db()
        with Session(engine) as session:
            task = session.get(Task, task_id)
            if not task or task.user_id != user_id:
                return json.dumps({"error": "Task not found"})
            task.completed = True
            session.add(task)
            session.commit()
            return json.dumps({"task_id": task.id, "status": "completed", "title": task.title})
    except Exception as exc:
        logger.exception("complete_task failed")
        return json.dumps({"error": f"Failed to complete task: {exc}"})


@mcp.tool()
def delete_task(user_id: str, task_id: int) -> str:
    """Delete a task from the list.

    Args:
        user_id: The authenticated user's ID
        task_id: The ID of the task to delete
    """
    try:
        _check_db()
        with Session(engine) as session:
            task = session.get(Task, task_id)
            if not task or task.user_id != user_id:
                return json.dumps({"error": "Task not found"})
            title = task.title
            session.delete(task)
            session.commit()
            return json.dumps({"task_id": task_id, "status": "deleted", "title": title})
    except Exception as exc:
        logger.exception("delete_task failed")
        return json.dumps({"error": f"Failed to delete task: {exc}"})


@mcp.tool()
def update_task(user_id: str, task_id: int, title: str = "", description: str = "") -> str:
    """Update a task's title or description.

    Args:
        user_id: The authenticated user's ID
        task_id: The ID of the task to update
        title: New title for the task (leave empty to keep current)
        description: New description for the task (leave empty to keep current)
    """
    try:
        _check_db()
        with Session(engine) as session:
            task = session.get(Task, task_id)
            if not task or task.user_id != user_id:
                return json.dumps({"error": "Task not found"})
            if title:
                task.title = title
            if description:
                task.description = description
            session.add(task)
            session.commit()
            session.refresh(task)
            return json.dumps({"task_id": task.id, "status": "updated", "title": task.title})
    except Exception as exc:
        logger.exception("update_task failed")
        return json.dumps({"error": f"Failed to update task: {exc}"})



if __name__ == "__main__":
    mcp.run(transport="stdio")
