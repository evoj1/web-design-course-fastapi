from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories import user_repository
from app.schemas.user import UserCreate, UserLogin
from app.utils.security import hash_password, verify_password


def register_user(db: Session, data: UserCreate) -> User:
    existing_user = user_repository.get_by_email(db, data.email)

    if existing_user:
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")

    user = User(
        full_name=data.full_name,
        email=data.email,
        hashed_password=hash_password(data.password),
        role="student"
    )

    created_user = user_repository.create(db, user)

    curator = user_repository.get_available_curator(db, max_students=5)

    if curator:
        created_user = user_repository.assign_student_to_curator(
            db=db,
            student=created_user,
            curator=curator
        )

    return created_user


def login_user(db: Session, data: UserLogin) -> User:
    user = user_repository.get_by_email(db, data.email)

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    return user
