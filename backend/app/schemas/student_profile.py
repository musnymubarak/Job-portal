from typing import List, Optional
from pydantic import BaseModel, HttpUrl
from app.models.student_profile import SkillLevel

# --- Portfolio Project Schemas ---
class PortfolioProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    link: Optional[str] = None # Using str instead of HttpUrl to be more lenient, or could use HttpUrl

class PortfolioProjectCreate(PortfolioProjectBase):
    pass

class PortfolioProject(PortfolioProjectBase):
    id: int
    profile_id: int

    class Config:
        from_attributes = True

# --- Student Skill Schemas ---
class StudentSkillBase(BaseModel):
    name: str
    level: SkillLevel

class StudentSkillCreate(StudentSkillBase):
    pass

class StudentSkill(StudentSkillBase):
    id: int
    profile_id: int

    class Config:
        from_attributes = True

# --- Student Profile Schemas ---
class StudentProfileBase(BaseModel):
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None

class StudentProfileCreate(StudentProfileBase):
    projects: List[PortfolioProjectCreate] = []
    skills: List[StudentSkillCreate] = []

class StudentProfileUpdate(StudentProfileBase):
    projects: Optional[List[PortfolioProjectCreate]] = None
    skills: Optional[List[StudentSkillCreate]] = None

class StudentProfile(StudentProfileBase):
    id: int
    user_id: int
    projects: List[PortfolioProject] = []
    skills: List[StudentSkill] = []

    class Config:
        from_attributes = True
