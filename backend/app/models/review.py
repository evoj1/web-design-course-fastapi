from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("student_works.id"), nullable=False)
    curator_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    status = Column(String, nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    work = relationship("StudentWork", back_populates="review")
    curator = relationship("User", back_populates="reviews")
