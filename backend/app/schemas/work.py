from datetime import datetime
from pydantic import BaseModel, ConfigDict


class WorkCreate(BaseModel):
    lesson_id: int
    file_path: str


class WorkRead(BaseModel):
    id: int
    student_id: int
    lesson_id: int
    file_path: str
    status: str
    submitted_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReviewCreate(BaseModel):
    work_id: int
    status: str
    comment: str
