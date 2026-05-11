from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.lesson import Lesson


def create(db: Session, lesson: Lesson) -> Lesson:
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


def get_all(db: Session):
    return db.query(Lesson).order_by(Lesson.order_number).all()


def get_by_id(db: Session, lesson_id: int) -> Lesson | None:
    return db.query(Lesson).filter(Lesson.id == lesson_id).first()


def delete(db: Session, lesson: Lesson) -> None:
    db.delete(lesson)
    db.commit()


def update(db: Session, lesson: Lesson, data: dict) -> Lesson:
    for field, value in data.items():
        if value is not None:
            setattr(lesson, field, value)
    db.commit()
    db.refresh(lesson)
    return lesson


def get_next_order_number(db: Session) -> int:
    max_number = db.query(func.max(Lesson.order_number)).scalar()
    return 1 if max_number is None else max_number + 1