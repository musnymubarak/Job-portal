from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum

class SkillLevel(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    github_url = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    portfolio_url = Column(String, nullable=True)

    # Relationship to User
    user = relationship("User", back_populates="student_profile")
    
    # Relationships to child tables
    projects = relationship("PortfolioProject", back_populates="profile", cascade="all, delete-orphan")
    skills = relationship("StudentSkill", back_populates="profile", cascade="all, delete-orphan")

class PortfolioProject(Base):
    __tablename__ = "portfolio_projects"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    link = Column(String, nullable=True)

    profile = relationship("StudentProfile", back_populates="projects")

class StudentSkill(Base):
    __tablename__ = "student_skills"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    name = Column(String, nullable=False)
    level = Column(String, default=SkillLevel.BEGINNER) # Storing as string to avoid enum issues, but validating with schema

    profile = relationship("StudentProfile", back_populates="skills")
