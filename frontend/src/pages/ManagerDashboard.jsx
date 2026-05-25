import React, { useEffect, useState } from "react";
import { API_URL, request } from "../api/api.js";
import Alert from "../components/Alert.jsx";
import Modal from "../components/Modal.jsx";

export default function ManagerDashboard() {
  const [lessons, setLessons] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [isLoading, setIsLoading] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editLesson, setEditLesson] = useState(null);

  const [title, setTitle] = useState("Урок 1. Основы UX");
  const [description, setDescription] = useState(
    "Видеоурок по базовым принципам пользовательского опыта."
  );
  const [videoFile, setVideoFile] = useState(null);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("curator");

  function success(text) {
    setMessageType("success");
    setMessage(text);
  }

  function error(text) {
    setMessageType("error");
    setMessage(text);
  }

  async function loadLessons() {
    setLessons(await request("/lessons/"));
  }

  async function loadUsers() {
    setUsers(
      await request("/users/students-and-curators", {
        headers: { "current-role": "manager" },
      })
    );
  }

  useEffect(() => {
    loadLessons().catch((err) => error(err.message));
    loadUsers().catch((err) => error(err.message));
  }, []);

  async function createLesson(event) {
    event.preventDefault();
    setMessage("");

    if (!videoFile) {
      error("Выберите видеофайл.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("video_file", videoFile);

      const response = await fetch(`${API_URL}/lessons/`, {
        method: "POST",
        headers: { current_role: "manager" },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.detail)
            ? data.detail.map((item) => item.msg).join("; ")
            : data.detail || "Ошибка загрузки видеоурока."
        );
      }

      setShowUploadModal(false);
      setVideoFile(null);
      success("Видеоурок успешно загружен!");
      await loadLessons();
    } catch (err) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteLesson(id) {
    setMessage("");

    if (!confirm("Вы уверены, что хотите удалить этот видеоурок?")) return;

    try {
      await request(`/lessons/${id}`, {
        method: "DELETE",
        headers: { current_role: "manager" },
      });

      success("Видеоурок успешно удалён!");
      await loadLessons();
    } catch (err) {
      error(err.message);
    }
  }

  async function updateLesson(event) {
    event.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      await request(`/lessons/${editLesson.id}`, {
        method: "PUT",
        headers: { current_role: "manager" },
        body: JSON.stringify({
          title: editLesson.title,
          description: editLesson.description,
          video_path: editLesson.video_path,
          order_number: Number(editLesson.order_number),
        }),
      });

      setEditLesson(null);
      success("Изменения успешно сохранены!");
      await loadLessons();
    } catch (err) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function changeRole(event) {
    event.preventDefault();
    setMessage("");

    if (!selectedUserId) {
      error("Заполните все обязательные поля.");
      return;
    }

    setIsLoading(true);

    try {
      await request("/users/change-role", {
        method: "POST",
        headers: { "current-role": "manager" },
        body: JSON.stringify({
          user_id: Number(selectedUserId),
          role: selectedRole,
        }),
      });

      setShowRoleModal(false);
      setSelectedUserId("");
      setSelectedRole("curator");
      success(
        selectedRole === "curator"
          ? "Куратор успешно назначен!"
          : "Роль пользователя успешно изменена!"
      );
      await loadUsers();
    } catch (err) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="panel-layout">
      <aside className="side-menu">
        <button onClick={() => setShowUploadModal(true)}>Загрузить видеоурок</button>
        <button onClick={() => setShowRoleModal(true)}>Назначить куратора</button>
        <a href="#lessons">Загруженные материалы</a>
      </aside>

      <section className="workspace">
        <Alert message={message} type={messageType} onClose={() => setMessage("")} />

        <section className="content-card" id="lessons">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Панель менеджера</p>
              <h2>Загруженные материалы</h2>
              <span>Список видеоуроков, доступных студентам.</span>
            </div>

            <button className="btn btn-muted" onClick={loadLessons}>
              Обновить
            </button>
          </div>

          {lessons.length === 0 && <div className="empty">Уроков пока нет.</div>}

          <div className="manager-list">
            {lessons.map((lesson) => (
              <article className="manager-item" key={lesson.id}>
                <div>
                  <small>Урок #{lesson.order_number}</small>
                  <h3>{lesson.title}</h3>
                  <p>{lesson.description}</p>
                  <span className="path-label">{lesson.video_path}</span>
                </div>

                <div className="item-actions">
                  <button className="btn btn-muted" onClick={() => setEditLesson({ ...lesson })}>
                    Изменить
                  </button>
                  <button className="btn btn-danger" onClick={() => deleteLesson(lesson.id)}>
                    Удалить
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      {showUploadModal && (
        <Modal title="Загрузить видеоурок" onClose={() => setShowUploadModal(false)}>
          <form onSubmit={createLesson}>
            <label>
              Название ролика
              <input value={title} onChange={(event) => setTitle(event.target.value)} required />
            </label>

            <label>
              Краткое описание
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} required />
            </label>

            <label>
              Видеофайл
              <input type="file" accept="video/*" onChange={(event) => setVideoFile(event.target.files[0])} required />
            </label>

            {videoFile && <div className="selected-file">Выбран файл: {videoFile.name}</div>}

            <div className="modal-actions">
              <button type="button" className="btn btn-muted" onClick={() => setShowUploadModal(false)}>
                Отмена
              </button>
              <button className="btn btn-primary" disabled={isLoading}>
                {isLoading ? "Загрузка..." : "Загрузить"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showRoleModal && (
        <Modal title="Назначить куратора" onClose={() => setShowRoleModal(false)}>
          <form onSubmit={changeRole}>
            <label>
              Выберите пользователя
              <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} required>
                <option value="">Выберите пользователя</option>
                {users.map((user) => (
                  <option value={user.id} key={user.id}>
                    {user.full_name} · {user.email} · {user.role}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Роль
              <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)}>
                <option value="curator">Куратор</option>
                <option value="student">Студент</option>
              </select>
            </label>

            <div className="modal-actions">
              <button type="button" className="btn btn-muted" onClick={() => setShowRoleModal(false)}>
                Отмена
              </button>
              <button className="btn btn-primary" disabled={isLoading}>
                {isLoading ? "Сохранение..." : "Подтвердить"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editLesson && (
        <Modal title="Изменить видеоурок" onClose={() => setEditLesson(null)}>
          <form onSubmit={updateLesson}>
            <label>
              Название
              <input
                value={editLesson.title}
                onChange={(event) => setEditLesson({ ...editLesson, title: event.target.value })}
                required
              />
            </label>

            <label>
              Описание
              <textarea
                value={editLesson.description}
                onChange={(event) => setEditLesson({ ...editLesson, description: event.target.value })}
                required
              />
            </label>

            <label>
              Путь к видео
              <input
                value={editLesson.video_path}
                onChange={(event) => setEditLesson({ ...editLesson, video_path: event.target.value })}
                required
              />
            </label>

            <label>
              Порядковый номер
              <input
                type="number"
                value={editLesson.order_number}
                onChange={(event) => setEditLesson({ ...editLesson, order_number: event.target.value })}
                required
              />
            </label>

            <div className="modal-actions">
              <button type="button" className="btn btn-muted" onClick={() => setEditLesson(null)}>
                Отмена
              </button>
              <button className="btn btn-primary" disabled={isLoading}>
                {isLoading ? "Сохранение..." : "Сохранить изменения"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
