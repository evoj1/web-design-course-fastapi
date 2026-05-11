import React, { useEffect, useState } from "react";
import { request } from "../api/api.js";
import Alert from "../components/Alert.jsx";
import Modal from "../components/Modal.jsx";

const API_URL = "http://127.0.0.1:8000";

export default function ManagerDashboard() {
  const [lessons, setLessons] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editLesson, setEditLesson] = useState(null);

  const [title, setTitle] = useState("Урок 1. Основы UX");
  const [description, setDescription] = useState("Видеоурок по базовым принципам пользовательского опыта.");
  const [videoFile, setVideoFile] = useState(null);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("curator");

  async function loadLessons() {
    setLessons(await request("/lessons/"));
  }

  async function loadUsers() {
      setUsers(await request("/users/students-and-curators", {
        headers: { "current-role": "manager" },
      }));
    }

  useEffect(() => {
    loadLessons().catch(e => setMessage(e.message));
    loadUsers().catch(e => setMessage(e.message));
  }, []);

  async function createLesson(e) {
    e.preventDefault();
    setMessage("");

    if (!videoFile) {
      setMessage("Выберите видеофайл");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("video_file", videoFile);

      const response = await fetch(`${API_URL}/lessons/`, {
        method: "POST",
        headers: {
          current_role: "manager",
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Ошибка загрузки видеоурока");
      }

      setMessage("Видеоурок успешно загружен.");
      setShowUploadModal(false);
      setVideoFile(null);
      await loadLessons();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function deleteLesson(id) {
    setMessage("");

    if (!confirm("Удалить этот видеоурок?")) return;

    try {
      await request(`/lessons/${id}`, {
        method: "DELETE",
        headers: { current_role: "manager" },
      });

      setMessage("Видеоурок успешно удалён.");
      await loadLessons();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function updateLesson(e) {
    e.preventDefault();
    setMessage("");

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

      setMessage("Изменения успешно сохранены.");
      setEditLesson(null);
      await loadLessons();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function changeRole(e) {
  e.preventDefault();
  setMessage("");

  if (!selectedUserId) {
    setMessage("Выберите пользователя");
    return;
  }

  const body = {
    user_id: Number(selectedUserId),
    role: selectedRole,
  };

  console.log("change-role body:", body);

  try {
    await request("/users/change-role", {
      method: "POST",
      headers: {
        "current-role": "manager",
      },
      body: JSON.stringify({
        user_id: Number(selectedUserId),
        role: selectedRole,
      }),
    });

    setMessage("Роль пользователя успешно изменена.");
    setSelectedUserId("");
    setSelectedRole("curator");
    setShowRoleModal(false);
    await loadUsers();
  } catch (err) {
    setMessage(err.message);
  }
}

  return (
    <main className="dashboard">
      <nav className="sidebar">
        <button className="sidebar-btn" onClick={() => setShowUploadModal(true)}>
          Загрузить видеоурок
        </button>

        <button className="sidebar-btn" onClick={() => setShowRoleModal(true)}>
          Назначить куратора
        </button>

        <a href="#lessons">Материалы</a>
      </nav>

      <section className="content-grid">
        <Alert
          message={message}
          type={message.includes("успеш") || message.includes("сохран") || message.includes("изменена") ? "success" : "error"}
        />

        <section className="card wide" id="lessons">
          <div className="section-head">
            <div>
              <h2>Загруженные материалы</h2>
              <p>Список видеоуроков.</p>
            </div>

            <button className="btn btn-light" onClick={loadLessons}>
              Обновить
            </button>
          </div>

          {lessons.length === 0 && (
            <div className="empty">Уроков пока нет.</div>
          )}

          <div className="table">
            {lessons.map((lesson) => (
              <div className="table-row" key={lesson.id}>
                <span>#{lesson.id}</span>
                <b>{lesson.title}</b>
                <span>Порядок: {lesson.order_number}</span>
                <span>{lesson.video_path}</span>

                <div className="actions">
                  <button
                    className="btn btn-light"
                    onClick={() => setEditLesson({ ...lesson })}
                  >
                    Изменить
                  </button>

                  <button
                    className="btn btn-danger"
                    onClick={() => deleteLesson(lesson.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>

      {showUploadModal && (
        <Modal
          title="Загрузить видеоурок"
          onClose={() => setShowUploadModal(false)}
        >
          <form onSubmit={createLesson}>
            <label>
              Название
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <label>
              Описание
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <label>
              Видеофайл
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files[0])}
              />
            </label>

            <button className="btn btn-primary">
              Загрузить
            </button>
          </form>
        </Modal>
      )}

      {showRoleModal && (
        <Modal
          title="Управление ролью пользователя"
          onClose={() => setShowRoleModal(false)}
        >
          <form onSubmit={changeRole}>
            <label>
              Пользователь
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">Выберите пользователя</option>

                {users.map((user) => (
                  <option value={user.id} key={user.id}>
                    #{user.id} · {user.full_name} · {user.email} · {user.role}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Новая роль
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="student">Студент</option>
                <option value="curator">Куратор</option>
              </select>
            </label>

            <button className="btn btn-primary">
              Сохранить роль
            </button>
          </form>
        </Modal>
      )}

      {editLesson && (
        <Modal
          title={`Изменить урок #${editLesson.id}`}
          onClose={() => setEditLesson(null)}
        >
          <form onSubmit={updateLesson}>
            <label>
              Название
              <input
                value={editLesson.title}
                onChange={(e) =>
                  setEditLesson({ ...editLesson, title: e.target.value })
                }
              />
            </label>

            <label>
              Описание
              <textarea
                value={editLesson.description}
                onChange={(e) =>
                  setEditLesson({ ...editLesson, description: e.target.value })
                }
              />
            </label>

            <label>
              Путь к видео
              <input
                value={editLesson.video_path}
                onChange={(e) =>
                  setEditLesson({ ...editLesson, video_path: e.target.value })
                }
              />
            </label>

            <label>
              Порядковый номер
              <input
                type="number"
                value={editLesson.order_number}
                onChange={(e) =>
                  setEditLesson({ ...editLesson, order_number: e.target.value })
                }
              />
            </label>

            <button className="btn btn-primary">
              Сохранить изменения
            </button>
          </form>
        </Modal>
      )}
    </main>
  );
}