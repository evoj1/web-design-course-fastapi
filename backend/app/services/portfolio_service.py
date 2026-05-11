from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.portfolio import PortfolioItem
from app.repositories import portfolio_repository, work_repository


def add_to_portfolio(db: Session, work_id: int, student_id: int):
    work = work_repository.get_work_by_id(db, work_id)

    if not work:
        raise HTTPException(status_code=404, detail="Работа не найдена")

    if work.student_id != student_id:
        raise HTTPException(status_code=403, detail="Нельзя добавить чужую работу в портфолио")

    if work.status != "completed":
        raise HTTPException(status_code=400, detail="В портфолио можно добавить только выполненную работу")

    existing_item = portfolio_repository.get_by_work_id(db, work_id)

    if existing_item:
        raise HTTPException(status_code=400, detail="Работа уже добавлена в портфолио")

    item = PortfolioItem(
        student_id=student_id,
        work_id=work_id
    )

    return portfolio_repository.create(db, item)


def get_student_portfolio(db: Session, student_id: int):
    return portfolio_repository.get_by_student_id(db, student_id)
