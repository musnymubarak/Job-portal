from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.project import ProjectStatus

class ProjectBase(BaseModel):
    title: str
    description: str

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None

class ProjectInDBBase(ProjectBase):
    id: int
    status: ProjectStatus
    student_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Project(ProjectInDBBase):
    pass
