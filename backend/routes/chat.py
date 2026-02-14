import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from auth import get_current_user, verify_user_access
from db import get_session
from models import ChatRequest, ChatResponse, Conversation, Message
from agent.chat_agent import run_agent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/{user_id}/chat", response_model=ChatResponse)
async def chat(
    user_id: str,
    body: ChatRequest,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    verify_user_access(user_id, current_user)

    # Validate message
    if not body.message or not body.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty",
        )

    # Resolve conversation
    if body.conversation_id is not None:
        conversation = session.get(Conversation, body.conversation_id)
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )
        if conversation.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )
        conversation.updated_at = datetime.now(timezone.utc)
        session.add(conversation)
    else:
        conversation = Conversation(user_id=user_id)
        session.add(conversation)
        session.commit()
        session.refresh(conversation)

    # Load message history
    statement = (
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())  # type: ignore[union-attr]
    )
    history = session.exec(statement).all()

    # Store user message
    user_msg = Message(
        user_id=user_id,
        conversation_id=conversation.id,
        role="user",
        content=body.message.strip(),
    )
    session.add(user_msg)
    session.commit()

    # Build messages list for agent
    messages = [{"role": msg.role, "content": msg.content} for msg in history]
    messages.append({"role": "user", "content": body.message.strip()})

    # Run agent
    try:
        agent_result = await run_agent(user_id, messages)
    except Exception as exc:
        logger.exception("Agent execution failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process message: {exc}",
        )

    # Store assistant message
    assistant_msg = Message(
        user_id=user_id,
        conversation_id=conversation.id,
        role="assistant",
        content=agent_result["response"],
    )
    session.add(assistant_msg)
    session.commit()

    return ChatResponse(
        conversation_id=conversation.id,
        response=agent_result["response"],
        tool_calls=agent_result["tool_calls"],
    )
