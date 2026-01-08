from sqlalchemy import Column, Integer, String, Boolean, Enum
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models.project import Project
from app.models.review import Review
from app.models.activity_log import ActivityLog
import enum

class UserRole(str, enum.Enum):
    STUDENT = "student"
    MENTOR = "mentor"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    cv_filename = Column(String, nullable=True)
    role = Column(String, default=UserRole.STUDENT)
    is_active = Column(Boolean, default=True)

    projects = relationship("Project", back_populates="student")
    reviews = relationship("Review", back_populates="mentor")
    activity_logs = relationship("ActivityLog", back_populates="user")
    notifications = relationship("Notification", back_populates="recipient")
    reset_tokens = relationship("PasswordResetToken", back_populates="user")

