from __future__ import annotations

from datetime import datetime
from typing import Annotated
from pydantic import BaseModel, Field, StringConstraints



class MessageBase(BaseModel):
    conversation_id: int = Field(
        ...,
        description="ID of the conversation this message belongs to.",
        json_schema_extra={"example": 1},
    )
    sender_id: int = Field(
        ...,
        description="User ID of the sender.",
        json_schema_extra={"example": 42},
    )
    message_type: Annotated[str, StringConstraints(strip_whitespace=True)] = Field(
        default="TEXT",
        description="Type of the message: TEXT, IMAGE, or SYSTEM.",
        json_schema_extra={"example": "TEXT"},
    )
    body: Annotated[str, StringConstraints(min_length=1)] = Field(
        ...,
        description="Message content text or short payload for IMAGE/SYSTEM.",
        json_schema_extra={"example": "Hey, are you still selling this item?"},
    )
    attachment_url: str | None = Field(
        default=None,
        description="Optional attachment (image or document) URL.",
        json_schema_extra={"example": "https://example.com/image.png"},
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "conversation_id": 1,
                    "sender_id": 42,
                    "message_type": "TEXT",
                    "body": "Hey, are you still selling this item?",
                    "attachment_url": None,
                }
            ]
        }
    }



class MessageCreate(MessageBase):
    """Request payload for creating a new message."""
    pass



class MessageRead(MessageBase):
    message_id: int = Field(
        ...,
        description="Primary key of the message (auto-increment).",
        json_schema_extra={"example": 1001},
    )
    created_at: datetime = Field(
        ...,
        description="Timestamp when the message was created (UTC).",
        json_schema_extra={"example": "2025-10-13T16:36:27Z"},
    )

    class Config:
        orm_mode = True
