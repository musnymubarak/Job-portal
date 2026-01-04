from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, validator, Field, field_validator

class JobBase(BaseModel):
    title: str
    description: str
    requirements: str
    job_type: Optional[str] = None # Internship, Full-time, Contract
    department: Optional[str] = None
    location: Optional[str] = "Onsite" # Remote, Onsite, Hybrid
    duration: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = "Draft" # Draft, Open, Closed
    
    responsibilities: Optional[List[str]] = []
    required_skills: Optional[List[str]] = []
    preferred_skills: Optional[List[str]] = []
    tools: Optional[List[str]] = []

    @field_validator('responsibilities', 'required_skills', 'preferred_skills', 'tools', mode='before')
    def null_to_list(cls, v):
        return v or []
    min_qualifications: Optional[str] = None

class JobCreate(JobBase):
    title: str
    description: str
    requirements: str # We can make this optional if responsibilities/skills cover it, but keeping required for now.
    
    @validator('deadline')
    def deadline_must_be_future(cls, v):
        if v and v < datetime.now(v.tzinfo):
            raise ValueError('Deadline must be in the future')
        return v
    pass

class JobUpdate(BaseModel): # Intentionally not inheriting from JobBase to make all optional
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    job_type: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    duration: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None
    responsibilities: Optional[List[str]] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    tools: Optional[List[str]] = None
    min_qualifications: Optional[str] = None
    
    @validator('deadline')
    def deadline_must_be_future(cls, v):
        if v and v < datetime.now(v.tzinfo):
            raise ValueError('Deadline must be in the future')
        return v

class JobInDBBase(JobBase):
    id: int
    admin_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Job(JobInDBBase):
    pass
