from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.portfolio import PortfolioItemRead
from app.services import portfolio_service

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


@router.post("/{work_id}", response_model=PortfolioItemRead)
def add_to_portfolio(
    work_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Header(..., alias="current-user-id")
):
    return portfolio_service.add_to_portfolio(db, work_id, current_user_id)


@router.get("/", response_model=list[PortfolioItemRead])
def get_my_portfolio(
    db: Session = Depends(get_db),
    current_user_id: int = Header(..., alias="current-user-id")
):
    return portfolio_service.get_student_portfolio(db, current_user_id)