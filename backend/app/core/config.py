class Settings:
    DATABASE_URL: str = "postgresql+psycopg2://postgres:mjwin@localhost:5432/web_design_course_db"
    SECRET_KEY: str = "change_me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60


settings = Settings()