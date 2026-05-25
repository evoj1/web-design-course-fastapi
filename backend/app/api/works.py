from app.core.database import get_db
from app.schemas.work import WorkRead, ReviewCreate
from app.services import work_service
from fastapi import APIRouter, Depends, Header, UploadFile, File, Form, Request, HTTPException
from sqlalchemy.orm import Session

router = APIRouter(prefix="/works", tags=["Student works"])


@router.get("/my", response_model=list[WorkRead])
def get_my_works(
    db: Session = Depends(get_db),
    current_user_id: int = Header(..., alias="current-user-id")
):
    return work_service.get_my_works(db, current_user_id)


@router.post("/", response_model=WorkRead)
def submit_work(
    lesson_id: int = Form(...),
    work_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user_id: int = Header(..., alias="current-user-id")
):
    return work_service.submit_work(
        db=db,
        lesson_id=lesson_id,
        work_file=work_file,
        student_id=current_user_id
    )


@router.get("/", response_model=list[WorkRead])
def get_works_for_curator(
    db: Session = Depends(get_db),
    current_user_id: int = Header(..., alias="current-user-id"),
    current_role: str = Header(..., alias="current-role")
):
    return work_service.get_works_for_curator(db, current_user_id, current_role)


@router.put("/{work_id}", response_model=WorkRead)
def update_work(
    work_id: int,
    work_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user_id: int = Header(..., alias="current-user-id")
):
    return work_service.update_work(
        db=db,
        work_id=work_id,
        work_file=work_file,
        student_id=current_user_id
    )


@router.delete("/{work_id}")
def delete_work(
    work_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Header(..., alias="current-user-id")
):
    return work_service.delete_work(
        db=db,
        work_id=work_id,
        student_id=current_user_id
    )


@router.post("/review")
async def review_work(
    request: Request,
    db: Session = Depends(get_db),
):
    current_user_id = request.headers.get("current-user-id")
    current_role = request.headers.get("current-role")

    if not current_user_id:
        raise HTTPException(status_code=400, detail="Не передан current-user-id")

    if not current_role:
        raise HTTPException(status_code=400, detail="Не передан current-role")

    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Некорректное тело запроса")

    work_id = data.get("work_id")
    status = data.get("status")
    comment = data.get("comment")

    if not work_id:
        raise HTTPException(status_code=400, detail="Не передан work_id")

    if status not in ["completed", "not_completed"]:
        raise HTTPException(status_code=400, detail="Некорректный статус")

    if not comment:
        raise HTTPException(status_code=400, detail="Не передан комментарий")

    review_data = ReviewCreate(
        work_id=int(work_id),
        status=status,
        comment=comment
    )

    return work_service.review_work(
        db=db,
        data=review_data,
        curator_id=int(current_user_id),
        current_role=current_role
    )
