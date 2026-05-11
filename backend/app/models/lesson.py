from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    video_path = Column(String, nullable=False)
    order_number = Column(Integer, nullable=False)

    works = relationship("StudentWork", back_populates="lesson")
