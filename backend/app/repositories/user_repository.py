from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.orm import aliased

from app.models.user import User


def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def create(db: Session, user: User) -> User:
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_role(db: Session, user: User, role: str) -> User:
    user.role = role
    db.commit()
    db.refresh(user)
    return user


def get_students_and_curators(db: Session):
    return db.query(User).filter(User.role.in_(["student", "curator"])).all()


def get_available_curator(db: Session, max_students: int = 5) -> User | None:
    Student = aliased(User)

    return (
        db.query(User)
        .outerjoin(Student, Student.curator_id == User.id)
        .filter(User.role == "curator")
        .group_by(User.id)
        .having(func.count(Student.id) < max_students)
        .order_by(func.count(Student.id))
        .first()
    )


def assign_student_to_curator(db: Session, student: User, curator: User) -> User:
    student.curator_id = curator.id
    db.commit()
    db.refresh(student)
    return student


def get_students_by_curator_id(db: Session, curator_id: int):
    return db.query(User).filter(
        User.role == "student",
        User.curator_id == curator_id
    ).all()
