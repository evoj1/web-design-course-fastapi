from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class StudentWork(Base):
    __tablename__ = "student_works"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    file_path = Column(String, nullable=False)

    # pending / completed / not_completed
    status = Column(String, default="pending", nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", back_populates="works")
    lesson = relationship("Lesson", back_populates="works")
    review = relationship("Review", back_populates="work", uselist=False)
    portfolio_item = relationship("PortfolioItem", back_populates="work", uselist=False)
