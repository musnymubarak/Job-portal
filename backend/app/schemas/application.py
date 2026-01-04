from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.application import ApplicationStatus

class ApplicationBase(BaseModel):
    pass

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    status: ApplicationStatus

class ApplicationInDBBase(ApplicationBase):
    id: int
    job_id: int
    student_id: int
    cv_snapshot_path: Optional[str] = None
    ats_score: float
    status: ApplicationStatus
    created_at: datetime
    
    # We will expand these if we need nested details in list views
    # but for now, simple IDs are enough, or we can use separate schemas for nested
    
    class Config:
        from_attributes = True

from app.schemas.user import User

class Application(ApplicationInDBBase):
    student: Optional[User] = None
