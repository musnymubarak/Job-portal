from typing import Optional
from pydantic import BaseModel
from datetime import datetime

# Shared properties
class NotificationBase(BaseModel):
    message: str
    type: Optional[str] = "info"

# Properties to receive via API on creation (Internal use mostly)
class NotificationCreate(NotificationBase):
    recipient_id: int

# Properties to return to client
class Notification(NotificationBase):
    id: int
    recipient_id: int
    is_read: bool
    created_at: datetime

    class Config:
        orm_mode = True
