from fastapi import APIRouter, Depends, Header, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.lesson import LessonCreate, LessonRead, LessonUpdate
from app.services import lesson_service

router = APIRouter(prefix="/lessons", tags=["Lessons"])


@router.get("/", response_model=list[LessonRead])
def get_lessons(db: Session = Depends(get_db)):
    return lesson_service.get_lessons(db)


@router.post("/", response_model=LessonRead)
def create_lesson(
    title: str = Form(...),
    description: str = Form(...),
    video_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_role: str = Header(..., convert_underscores=False)
):
    return lesson_service.create_lesson(
        db=db,
        title=title,
        description=description,
        video_file=video_file,
        current_role=current_role
    )


@router.put("/{lesson_id}", response_model=LessonRead)
def update_lesson(
    lesson_id: int,
    data: LessonUpdate,
    db: Session = Depends(get_db),
    current_role: str = Header(..., convert_underscores=False)
):
    return lesson_service.update_lesson(db, lesson_id, data, current_role)


@router.delete("/{lesson_id}")
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_role: str = Header(..., convert_underscores=False)
):
    return lesson_service.delete_lesson(db, lesson_id, current_role)
