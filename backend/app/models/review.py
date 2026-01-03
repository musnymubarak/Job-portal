from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    comments = Column(String, nullable=False)
    verdict = Column(String, nullable=False) # e.g., "Approved", "Rejected", "Changes Requested"
    project_id = Column(Integer, ForeignKey("projects.id"))
    mentor_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="reviews")
    mentor = relationship("User", back_populates="reviews")
