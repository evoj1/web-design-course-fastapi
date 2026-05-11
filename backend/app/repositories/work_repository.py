from sqlalchemy.orm import Session

from app.models.student_work import StudentWork
from app.models.review import Review
from app.models.user import User


def create_work(db: Session, work: StudentWork) -> StudentWork:
    db.add(work)
    db.commit()
    db.refresh(work)
    return work


def get_work_by_id(db: Session, work_id: int) -> StudentWork | None:
    return db.query(StudentWork).filter(StudentWork.id == work_id).first()


def get_works_by_curator_id(db: Session, curator_id: int):
    return (
        db.query(StudentWork)
        .join(User, StudentWork.student_id == User.id)
        .filter(User.curator_id == curator_id)
        .order_by(StudentWork.submitted_at.desc())
        .all()
    )


def get_all_works(db: Session):
    return db.query(StudentWork).order_by(StudentWork.submitted_at.desc()).all()


def create_review(db: Session, review: Review) -> Review:
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


def update_work_status(db: Session, work: StudentWork, status: str) -> StudentWork:
    work.status = status
    db.commit()
    db.refresh(work)
    return work


def get_works_by_student_id(db: Session, student_id: int):
    return db.query(StudentWork).filter(
        StudentWork.student_id == student_id
    ).all()


def get_work_by_student_and_lesson(db: Session, student_id: int, lesson_id: int):
    return db.query(StudentWork).filter(
        StudentWork.student_id == student_id,
        StudentWork.lesson_id == lesson_id
    ).first()