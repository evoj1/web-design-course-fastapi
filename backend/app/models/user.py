from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    role = Column(String, default="student", nullable=False)

    curator_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    curator = relationship(
        "User",
        remote_side=[id],
        back_populates="students"
    )

    students = relationship(
        "User",
        back_populates="curator"
    )

    works = relationship("StudentWork", back_populates="student")
    reviews = relationship("Review", back_populates="curator")
    portfolio_items = relationship("PortfolioItem", back_populates="student")
