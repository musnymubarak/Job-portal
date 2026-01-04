from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base
import enum

class JobStatus(str, enum.Enum):
    DRAFT = "Draft"
    OPEN = "Open"
    CLOSED = "Closed"

class JobLocation(str, enum.Enum):
    REMOTE = "Remote"
    ONSITE = "Onsite"
    HYBRID = "Hybrid"

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=False)
    # requirements will be used for formatted list, but we keep the old column for now or migrate data if needed.
    # User asked for "Required skills (list)" which suggests a JSON/Array.
    # Let's keep requirements as Text for general reqs, and add specific JSON fields.
    requirements = Column(Text, nullable=False) 
    
    job_type = Column(String, index=True, nullable=True) # Keep string for flexibility or strict Enum if preferred. User asked for specific types.
    department = Column(String, index=True, nullable=True)
    
    # New Fields
    location = Column(String, default=JobLocation.ONSITE.value) # Storing as String for simples, or Enum type
    duration = Column(String, nullable=True) # e.g. "3 months"
    deadline = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, default=JobStatus.DRAFT.value, index=True)
    
    # Rich Text / JSON Lists
    responsibilities = Column(JSON, default=list) # List[str]
    required_skills = Column(JSON, default=list) # List[str]
    preferred_skills = Column(JSON, default=list) # List[str]
    tools = Column(JSON, default=list) # List[str]
    min_qualifications = Column(Text, nullable=True)
    
    admin_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    admin = relationship("User", backref="posted_jobs")
    applications = relationship("Application", back_populates="job")
