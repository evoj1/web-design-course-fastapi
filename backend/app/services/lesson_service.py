import os
import shutil
from uuid import uuid4
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.models.lesson import Lesson
from app.repositories import lesson_repository
from app.schemas.lesson import LessonCreate, LessonUpdate
from app.models.student_work import StudentWork
from app.models.review import Review
from app.models.portfolio import PortfolioItem

UPLOAD_DIR = "uploads/videos"

def create_lesson(
    db: Session,
    title: str,
    description: str,
    video_file: UploadFile,
    current_role: str
):
    if current_role != "manager":
        raise HTTPException(status_code=403, detail="Загружать видеоуроки может только менеджер")

    allowed_extensions = [".mp4", ".mov", ".avi", ".mkv"]
    original_name = video_file.filename
    extension = os.path.splitext(original_name)[1].lower()

    if extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Недопустимый формат видеофайла")

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    unique_filename = f"{uuid4().hex}{extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(video_file.file, buffer)

    video_path_for_db = f"/uploads/videos/{unique_filename}"

    next_order_number = lesson_repository.get_next_order_number(db)

    lesson = Lesson(
        title=title,
        description=description,
        video_path=video_path_for_db,
        order_number=next_order_number
    )

    return lesson_repository.create(db, lesson)


def get_lessons(db: Session):
    return lesson_repository.get_all(db)


def update_lesson(db: Session, lesson_id: int, data: LessonUpdate, current_role: str):
    if current_role != "manager":
        raise HTTPException(status_code=403, detail="Изменять видеоуроки может только менеджер")

    lesson = lesson_repository.get_by_id(db, lesson_id)

    if not lesson:
        raise HTTPException(status_code=404, detail="Видеоурок не найден")

    return lesson_repository.update(db, lesson, data.model_dump())


def delete_lesson(db: Session, lesson_id: int, current_role: str):
    if current_role != "manager":
        raise HTTPException(status_code=403, detail="Удалять видеоуроки может только менеджер")

    lesson = lesson_repository.get_by_id(db, lesson_id)

    if not lesson:
        raise HTTPException(status_code=404, detail="Видеоурок не найден")

    works = db.query(StudentWork).filter(StudentWork.lesson_id == lesson_id).all()

    for work in works:
        db.query(PortfolioItem).filter(PortfolioItem.work_id == work.id).delete()
        db.query(Review).filter(Review.work_id == work.id).delete()

        work_file = work.file_path.lstrip("/")
        if os.path.exists(work_file):
            os.remove(work_file)

        db.delete(work)

    lesson_file = lesson.video_path.lstrip("/")
    if os.path.exists(lesson_file):
        os.remove(lesson_file)

    db.delete(lesson)
    db.commit()

    return {"message": "Видеоурок и связанные данные успешно удалены"}
