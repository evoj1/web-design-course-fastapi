from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repositories import user_repository


def change_user_role(db: Session, user_id: int, role: str, current_role: str):
    if current_role != "manager":
        raise HTTPException(status_code=403, detail="Менять роли может только менеджер")

    if role not in ["student", "curator"]:
        raise HTTPException(status_code=400, detail="Можно назначить только student или curator")

    user = user_repository.get_by_id(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if user.role == "manager":
        raise HTTPException(status_code=400, detail="Нельзя изменить роль менеджера")

    if role == "curator":
        user.curator_id = None

    updated_user = user_repository.update_role(db, user, role)

    if role == "student" and updated_user.curator_id is None:
        curator = user_repository.get_available_curator(db, max_students=5)

        if curator:
            updated_user = user_repository.assign_student_to_curator(
                db=db,
                student=updated_user,
                curator=curator
            )

    return updated_user


def get_students_and_curators(db: Session, current_role: str):
    if current_role != "manager":
        raise HTTPException(status_code=403, detail="Список пользователей доступен только менеджеру")

    return user_repository.get_students_and_curators(db)
