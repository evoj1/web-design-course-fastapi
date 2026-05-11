from datetime import datetime
from pydantic import BaseModel, ConfigDict


class PortfolioItemRead(BaseModel):
    id: int
    student_id: int
    work_id: int
    added_at: datetime

    model_config = ConfigDict(from_attributes=True)
