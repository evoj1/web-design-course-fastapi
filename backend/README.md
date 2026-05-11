# Информационная система онлайн-курса «Основы веб-дизайна и UX/UI»

Структура проекта построена по слоям:

- `api` — эндпоинты FastAPI
- `services` — бизнес-логика
- `repositories` — работа с базой данных
- `models` — SQLAlchemy ORM-модели
- `schemas` — Pydantic-схемы для входных и выходных данных
- `core` — настройки и подключение к БД
- `utils` — вспомогательные функции

Запуск:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```
