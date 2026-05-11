from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.user import UserRead
from app.services import user_service

router = APIRouter(prefix="/users", tags=["Users"])


def get_current_role(request: Request) -> str:
    return (
        request.headers.get("current-role")
        or request.headers.get("current_role")
        or ""
    )


@router.get("/students-and-curators", response_model=list[UserRead])
def get_students_and_curators(
    request: Request,
    db: Session = Depends(get_db),
):
    current_role = get_current_role(request)
    return user_service.get_students_and_curators(db, current_role)


@router.post("/change-role", response_model=UserRead)
async def change_user_role(
    request: Request,
    db: Session = Depends(get_db),
):
    current_role = get_current_role(request)

    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Некорректное тело запроса")

    user_id = data.get("user_id")
    role = data.get("role")

    if not user_id:
        raise HTTPException(status_code=400, detail="Не выбран пользователь")

    if role not in ["student", "curator"]:
        raise HTTPException(status_code=400, detail="Некорректная роль")

    return user_service.change_user_role(
        db=db,
        user_id=int(user_id),
        role=role,
        current_role=current_role,
    )