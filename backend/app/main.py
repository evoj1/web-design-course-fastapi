from pathlib import Path

from app.api.auth import router as auth_router
from app.api.lessons import router as lessons_router
from app.api.portfolio import router as portfolio_router
from app.api.users import router as users_router
from app.api.works import router as works_router
from app.core.database import Base, engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

Base.metadata.create_all(bind=engine)


Path("uploads/videos").mkdir(parents=True, exist_ok=True)
Path("uploads/works").mkdir(parents=True, exist_ok=True)


app = FastAPI(
    title="Онлайн-курс «Основы веб-дизайна и UX/UI»",
    version="1.0.0"
)


BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")
app.mount("/uploads", StaticFiles(directory=BASE_DIR / "uploads"), name="uploads")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(lessons_router)
app.include_router(works_router)
app.include_router(portfolio_router)
app.include_router(users_router)




@app.get("/")
def serve_frontend():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/{full_path:path}")
def serve_react_app(full_path: str):
    file_path = STATIC_DIR / full_path

    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)

    return FileResponse(STATIC_DIR / "index.html")