from sqlalchemy.orm import Session

from app.models.portfolio import PortfolioItem


def get_by_work_id(db: Session, work_id: int) -> PortfolioItem | None:
    return db.query(PortfolioItem).filter(PortfolioItem.work_id == work_id).first()


def create(db: Session, item: PortfolioItem) -> PortfolioItem:
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def get_by_student_id(db: Session, student_id: int):
    return db.query(PortfolioItem).filter(PortfolioItem.student_id == student_id).all()
