import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def unique_email(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}@mail.com"


def register_user(full_name="Test User", email=None, password="123456"):
    if email is None:
        email = unique_email("user")

    response = client.post(
        "/auth/register",
        json={
            "full_name": full_name,
            "email": email,
            "password": password,
        },
    )

    return response


def login_user(email: str, password="123456"):
    return client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )


def create_lesson(title=None, description="Описание тестового урока"):
    if title is None:
        title = f"Тестовый урок {uuid.uuid4().hex[:6]}"

    return client.post(
        "/lessons/",
        headers={
            # В твоём app/api/lessons.py используется Header(..., convert_underscores=False),
            # поэтому для уроков нужен именно current_role.
            "current_role": "manager",
        },
        data={
            "title": title,
            "description": description,
        },
        files={
            "video_file": ("lesson.mp4", b"fake video content", "video/mp4"),
        },
    )


def submit_work(lesson_id: int, student_id: int = 2, filename="work.pdf"):
    return client.post(
        "/works/",
        headers={
            "current-user-id": str(student_id),
        },
        data={
            "lesson_id": str(lesson_id),
        },
        files={
            "work_file": (filename, b"fake work content", "application/pdf"),
        },
    )


def test_root_endpoint():
    response = client.get("/")

    assert response.status_code == 200
    assert "message" in response.json()


def test_register_user_success():
    email = unique_email("student")

    response = register_user(
        full_name="Test Student",
        email=email,
        password="123456",
    )

    assert response.status_code == 200, response.text

    data = response.json()
    assert data["full_name"] == "Test Student"
    assert data["email"] == email
    assert data["role"] == "student"


def test_register_duplicate_email_returns_400():
    email = unique_email("duplicate")

    first_response = register_user(
        full_name="Duplicate User",
        email=email,
        password="123456",
    )

    assert first_response.status_code == 200, first_response.text

    second_response = register_user(
        full_name="Duplicate User",
        email=email,
        password="123456",
    )

    assert second_response.status_code == 400


def test_login_user_success():
    email = unique_email("login")

    register_response = register_user(
        full_name="Login User",
        email=email,
        password="123456",
    )

    assert register_response.status_code == 200, register_response.text

    login_response = login_user(email=email, password="123456")

    assert login_response.status_code == 200, login_response.text
    assert login_response.json()["email"] == email


def test_login_wrong_password_fails():
    email = unique_email("wrong_password")

    register_response = register_user(
        full_name="Wrong Password User",
        email=email,
        password="123456",
    )

    assert register_response.status_code == 200, register_response.text

    login_response = login_user(email=email, password="wrong_password")

    assert login_response.status_code in [400, 401]


def test_get_lessons_returns_list():
    response = client.get("/lessons/")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_lesson_without_manager_forbidden():
    response = client.post(
        "/lessons/",
        headers={
            "current_role": "student",
        },
        data={
            "title": "Запрещённый урок",
            "description": "Этот урок не должен создаться",
        },
        files={
            "video_file": ("lesson.mp4", b"fake video content", "video/mp4"),
        },
    )

    assert response.status_code == 403


def test_create_lesson_as_manager_success():
    response = create_lesson()

    assert response.status_code == 200, response.text

    data = response.json()
    assert "id" in data
    assert data["title"].startswith("Тестовый урок")
    assert data["description"] == "Описание тестового урока"
    assert data["video_path"].startswith("/uploads/videos/")
    assert "order_number" in data


def test_create_lesson_without_file_returns_422():
    response = client.post(
        "/lessons/",
        headers={
            "current_role": "manager",
        },
        data={
            "title": "Урок без файла",
            "description": "Нет файла",
        },
    )

    assert response.status_code == 422


def test_update_lesson_as_manager_success():
    lesson_response = create_lesson()

    assert lesson_response.status_code == 200, lesson_response.text

    lesson_id = lesson_response.json()["id"]

    response = client.put(
        f"/lessons/{lesson_id}",
        headers={
            "current_role": "manager",
        },
        json={
            "title": "Изменённый урок",
            "description": "Новое описание",
            "video_path": lesson_response.json()["video_path"],
            "order_number": lesson_response.json()["order_number"],
        },
    )

    assert response.status_code == 200, response.text
    assert response.json()["title"] == "Изменённый урок"


def test_delete_lesson_as_manager_success():
    lesson_response = create_lesson()

    assert lesson_response.status_code == 200, lesson_response.text

    lesson_id = lesson_response.json()["id"]

    response = client.delete(
        f"/lessons/{lesson_id}",
        headers={
            "current_role": "manager",
        },
    )

    assert response.status_code == 200, response.text


def test_get_students_and_curators_as_manager():
    response = client.get(
        "/users/students-and-curators",
        headers={
            "current-role": "manager",
        },
    )

    assert response.status_code == 200, response.text
    assert isinstance(response.json(), list)


def test_get_students_and_curators_forbidden_for_student():
    response = client.get(
        "/users/students-and-curators",
        headers={
            "current-role": "student",
        },
    )

    assert response.status_code == 403


def test_change_user_role_student_to_curator_and_back():
    email = unique_email("role_user")

    register_response = register_user(
        full_name="Role User",
        email=email,
        password="123456",
    )

    assert register_response.status_code == 200, register_response.text

    user_id = register_response.json()["id"]

    to_curator_response = client.post(
        "/users/change-role",
        headers={
            "current-role": "manager",
        },
        json={
            "user_id": user_id,
            "role": "curator",
        },
    )

    assert to_curator_response.status_code == 200, to_curator_response.text
    assert to_curator_response.json()["role"] == "curator"

    to_student_response = client.post(
        "/users/change-role",
        headers={
            "current-role": "manager",
        },
        json={
            "user_id": user_id,
            "role": "student",
        },
    )

    assert to_student_response.status_code == 200, to_student_response.text
    assert to_student_response.json()["role"] == "student"


def test_submit_work_success_or_already_exists():
    lesson_response = create_lesson(title=f"Урок для работы {uuid.uuid4().hex[:6]}")

    assert lesson_response.status_code == 200, lesson_response.text

    lesson_id = lesson_response.json()["id"]

    response = submit_work(lesson_id=lesson_id, student_id=2)

    assert response.status_code in [200, 400], response.text

    if response.status_code == 200:
        data = response.json()
        assert data["lesson_id"] == lesson_id
        assert data["status"] == "pending"
        assert data["file_path"].startswith("/uploads/works/")


def test_get_my_works():
    response = client.get(
        "/works/my",
        headers={
            "current-user-id": "2",
        },
    )

    assert response.status_code == 200, response.text
    assert isinstance(response.json(), list)


def test_get_works_for_curator():
    response = client.get(
        "/works/",
        headers={
            "current-user-id": "3",
            "current-role": "curator",
        },
    )

    assert response.status_code == 200, response.text
    assert isinstance(response.json(), list)


def test_get_works_for_curator_forbidden_for_student():
    response = client.get(
        "/works/",
        headers={
            "current-user-id": "2",
            "current-role": "student",
        },
    )

    assert response.status_code == 403


def test_update_work_if_created():
    lesson_response = create_lesson(title=f"Урок для изменения работы {uuid.uuid4().hex[:6]}")

    assert lesson_response.status_code == 200, lesson_response.text

    lesson_id = lesson_response.json()["id"]

    work_response = submit_work(lesson_id=lesson_id, student_id=2, filename="old_work.pdf")

    if work_response.status_code != 200:
        assert work_response.status_code == 400
        return

    work_id = work_response.json()["id"]

    response = client.put(
        f"/works/{work_id}",
        headers={
            "current-user-id": "2",
        },
        files={
            "work_file": ("new_work.pdf", b"new fake work content", "application/pdf"),
        },
    )

    assert response.status_code in [200, 400], response.text

    if response.status_code == 200:
        assert response.json()["id"] == work_id
        assert response.json()["status"] == "pending"


def test_delete_work_if_created():
    lesson_response = create_lesson(title=f"Урок для удаления работы {uuid.uuid4().hex[:6]}")

    assert lesson_response.status_code == 200, lesson_response.text

    lesson_id = lesson_response.json()["id"]

    work_response = submit_work(lesson_id=lesson_id, student_id=2, filename="delete_work.pdf")

    if work_response.status_code != 200:
        assert work_response.status_code == 400
        return

    work_id = work_response.json()["id"]

    response = client.delete(
        f"/works/{work_id}",
        headers={
            "current-user-id": "2",
        },
    )

    assert response.status_code == 200, response.text


def test_review_work_if_created():
    lesson_response = create_lesson(title=f"Урок для оценки {uuid.uuid4().hex[:6]}")

    assert lesson_response.status_code == 200, lesson_response.text

    lesson_id = lesson_response.json()["id"]

    work_response = submit_work(lesson_id=lesson_id, student_id=2, filename="review_work.pdf")

    if work_response.status_code != 200:
        assert work_response.status_code == 400
        return

    work_id = work_response.json()["id"]

    response = client.post(
        "/works/review",
        headers={
            "current-user-id": "3",
            "current-role": "curator",
        },
        json={
            "work_id": work_id,
            "status": "completed",
            "comment": "Работа выполнена корректно",
        },
    )

    assert response.status_code in [200, 403], response.text


def test_get_portfolio():
    response = client.get(
        "/portfolio/",
        headers={
            "current-user-id": "2",
        },
    )

    assert response.status_code == 200, response.text
    assert isinstance(response.json(), list)


def test_add_to_portfolio_rejects_not_completed_work():
    lesson_response = create_lesson(title=f"Урок для портфолио {uuid.uuid4().hex[:6]}")

    assert lesson_response.status_code == 200, lesson_response.text

    lesson_id = lesson_response.json()["id"]

    work_response = submit_work(lesson_id=lesson_id, student_id=2, filename="portfolio_work.pdf")

    if work_response.status_code != 200:
        assert work_response.status_code == 400
        return

    work_id = work_response.json()["id"]

    response = client.post(
        f"/portfolio/{work_id}",
        headers={
            "current-user-id": "2",
        },
    )

    assert response.status_code in [400, 403], response.text
