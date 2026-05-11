from pydantic import BaseModel, ConfigDict


class LessonCreate(BaseModel):
    title: str
    description: str
    video_path: str
    order_number: int


class LessonUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    video_path: str | None = None
    order_number: int | None = None


class LessonRead(BaseModel):
    id: int
    title: str
    description: str
    video_path: str
    order_number: int

    model_config = ConfigDict(from_attributes=True)
