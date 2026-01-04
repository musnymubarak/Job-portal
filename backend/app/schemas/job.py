from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class JobBase(BaseModel):
    title: str
    description: str
    requirements: str
    job_type: Optional[str] = None
    department: Optional[str] = None

class JobCreate(JobBase):
    pass

class JobUpdate(JobBase):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    job_type: Optional[str] = None
    department: Optional[str] = None

class JobInDBBase(JobBase):
    id: int
    admin_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Job(JobInDBBase):
    pass
