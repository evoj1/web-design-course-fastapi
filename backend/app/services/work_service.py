import os
import shutil
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.models.student_work import StudentWork
from app.models.review import Review
from app.repositories import work_repository
from app.schemas.work import ReviewCreate

UPLOAD_WORKS_DIR = "uploads/works"


def get_my_works(db: Session, student_id: int):
    return work_repository.get_works_by_student_id(db, student_id)


def get_works_for_curator(db: Session, curator_id: int, current_role: str):
    if current_role != "curator":
        raise HTTPException(status_code=403, detail="Просматривать работы может только куратор")

    return work_repository.get_works_by_curator_id(db, curator_id)


def submit_work(
    db: Session,
    lesson_id: int,
    work_file: UploadFile,
    student_id: int
):
    existing_work = work_repository.get_work_by_student_and_lesson(
        db=db,
        student_id=student_id,
        lesson_id=lesson_id
    )

    if existing_work:
        raise HTTPException(
            status_code=400,
            detail="Работа по этому уроку уже отправлена. Вы можете изменить или удалить её."
        )

    os.makedirs(UPLOAD_WORKS_DIR, exist_ok=True)

    original_name = work_file.filename
    extension = os.path.splitext(original_name)[1].lower()

    unique_filename = f"{uuid4().hex}{extension}"
    file_path = os.path.join(UPLOAD_WORKS_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(work_file.file, buffer)

    file_path_for_db = f"/uploads/works/{unique_filename}"

    work = StudentWork(
        student_id=student_id,
        lesson_id=lesson_id,
        file_path=file_path_for_db,
        status="pending"
    )

    return work_repository.create_work(db, work)


def update_work(
    db: Session,
    work_id: int,
    work_file: UploadFile,
    student_id: int
):
    work = work_repository.get_work_by_id(db, work_id)

    if not work:
        raise HTTPException(status_code=404, detail="Работа не найдена")

    if work.student_id != student_id:
        raise HTTPException(status_code=403, detail="Нельзя изменить чужую работу")

    if work.status == "completed":
        raise HTTPException(status_code=400, detail="Выполненную работу нельзя изменить")

    old_path = work.file_path.lstrip("/")

    if os.path.exists(old_path):
        os.remove(old_path)

    os.makedirs(UPLOAD_WORKS_DIR, exist_ok=True)

    original_name = work_file.filename
    extension = os.path.splitext(original_name)[1].lower()
    unique_filename = f"{uuid4().hex}{extension}"
    file_path = os.path.join(UPLOAD_WORKS_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(work_file.file, buffer)

    work.file_path = f"/uploads/works/{unique_filename}"
    work.status = "pending"

    db.commit()
    db.refresh(work)

    return work


def delete_work(db: Session, work_id: int, student_id: int):
    work = work_repository.get_work_by_id(db, work_id)

    if not work:
        raise HTTPException(status_code=404, detail="Работа не найдена")

    if work.student_id != student_id:
        raise HTTPException(status_code=403, detail="Нельзя удалить чужую работу")

    if work.status == "completed":
        raise HTTPException(status_code=400, detail="Выполненную работу нельзя удалить")

    file_path = work.file_path.lstrip("/")

    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(work)
    db.commit()

    return {"message": "Работа удалена"}

def review_work(
    db: Session,
    data: ReviewCreate,
    curator_id: int,
    current_role: str
):
    if current_role != "curator":
        raise HTTPException(status_code=403, detail="Оценивать работы может только куратор")

    if data.status not in ["completed", "not_completed"]:
        raise HTTPException(status_code=400, detail="Статус должен быть completed или not_completed")

    work = work_repository.get_work_by_id(db, data.work_id)

    if not work:
        raise HTTPException(status_code=404, detail="Работа не найдена")

    review = Review(
        work_id=data.work_id,
        curator_id=curator_id,
        status=data.status,
        comment=data.comment
    )

    work.status = data.status

    db.add(review)
    db.commit()
    db.refresh(review)

    return {
        "message": "Оценка сохранена",
        "work_id": work.id,
        "status": work.status,
        "comment": data.comment
    }
