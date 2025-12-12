from __future__ import annotations

from datetime import datetime
from typing import Annotated
from pydantic import BaseModel, Field, PositiveInt, model_validator



class ConversationBase(BaseModel):

    user_a_id: PositiveInt = Field(
        ...,
        description="Smaller user ID in the pair (user_a_id < user_b_id).",
        json_schema_extra={"example": 1},
    )
    user_b_id: PositiveInt = Field(
        ...,
        description="Larger user ID in the pair (user_a_id < user_b_id).",
        json_schema_extra={"example": 2},
    )

    # Extra validation — ensure the two users are not equal
    @model_validator(mode="after")
    def validate_pair(self):
        if self.user_a_id == self.user_b_id:
            raise ValueError("user_a_id and user_b_id must be different.")
        return self

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"user_a_id": 1, "user_b_id": 7},
            ]
        }
    }


# ============================================================
# Create schema — Payload for POST /conversations
# ============================================================

class ConversationCreate(ConversationBase):
    """Payload for creating a new conversation."""
    pass


# ============================================================
# Read schema — Returned by GET endpoints
# ============================================================

class ConversationRead(ConversationBase):
    """
    Schema returned to clients.
    Includes database-generated fields such as conversation_id and timestamps.
    """
    conversation_id: int = Field(
        ...,
        description="Auto-incremented ID of the conversation.",
        json_schema_extra={"example": 10},
    )
    created_at: datetime = Field(
        ...,
        description="Timestamp when the conversation was created (UTC).",
        json_schema_extra={"example": "2025-10-13T16:36:27Z"},
    )
    last_message_at: datetime | None = Field(
        default=None,
        description="Timestamp of the latest message (UTC).",
        json_schema_extra={"example": "2025-10-14T05:11:20Z"},
    )

    class Config:
        orm_mode = True


# ============================================================
# Optional: Lightweight item for listing conversations
# (Used for GET /conversations?user_id=…)
# ============================================================

class ConversationListItem(BaseModel):
    """
    Lightweight conversation representation for list views.
    Useful for endpoints that return many conversations.
    """
    conversation_id: int = Field(..., example=10)
    user_a_id: int = Field(..., example=1)
    user_b_id: int = Field(..., example=7)
    last_message_at: datetime | None = Field(None, example="2025-10-14T05:11:20Z")

    class Config:
        orm_mode = True
