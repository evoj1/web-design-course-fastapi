from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class PortfolioItem(Base):
    __tablename__ = "portfolio_items"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    work_id = Column(Integer, ForeignKey("student_works.id"), unique=True, nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", back_populates="portfolio_items")
    work = relationship("StudentWork", back_populates="portfolio_item")
