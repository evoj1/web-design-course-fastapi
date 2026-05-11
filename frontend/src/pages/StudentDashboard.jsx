import React, { useEffect, useState } from "react";
import { request } from "../api/api.js";
import Alert from "../components/Alert.jsx";
import Modal from "../components/Modal.jsx";

const API_URL = "http://127.0.0.1:8000";

export default function StudentDashboard({ user }) {
  const [page, setPage] = useState("lessons");
  const [lessons, setLessons] = useState([]);
  const [works, setWorks] = useState([]);
  const [portfolio, setPortfolio] = useState([]);

  const [selectedLesson, setSelectedLesson] = useState(null);
  const [workFile, setWorkFile] = useState(null);
  const [message, setMessage] = useState("");

  async function loadLessons() {
    setLessons(await request("/lessons/"));
  }

  async function loadWorks() {
    setWorks(await request("/works/my", {
      headers: {
        "current-user-id": user.id,
      },
    }));
  }

  async function updateWork(workId) {
  setMessage("");

  if (!workFile) {
    setMessage("Выберите новый файл работы");
    return;
  }

  const formData = new FormData();
  formData.append("work_file", workFile);

  const response = await fetch(`${API_URL}/works/${workId}`, {
    method: "PUT",
    headers: {
      "current-user-id": user.id,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    setMessage(data.detail || "Ошибка изменения работы");
    return;
  }

  setMessage("Работа изменена и снова отправлена на проверку.");
  setWorkFile(null);
  await loadWorks();
}

async function deleteWork(workId) {
  setMessage("");

  if (!confirm("Удалить отправленную работу?")) return;

  try {
    await request(`/works/${workId}`, {
      method: "DELETE",
      headers: {
        "current-user-id": user.id,
      },
    });

    setMessage("Работа удалена.");
    await loadWorks();
  } catch (err) {
    setMessage(err.message);
  }
}

  async function loadPortfolio() {
    setPortfolio(await request("/portfolio/", {
      headers: {
        "current-user-id": user.id,
      },
    }));
  }

  useEffect(() => {
    loadLessons().catch(e => setMessage(e.message));
    loadWorks().catch(e => setMessage(e.message));
    loadPortfolio().catch(e => setMessage(e.message));
  }, []);

  function getWorkForLesson(lessonId) {
    return works.find(work => work.lesson_id === lessonId);
  }

  function getStatusText(status) {
    if (status === "pending") return "Не оценено";
    if (status === "not_completed") return "Не выполнено";
    if (status === "completed") return "Выполнено";
    return status;
  }

  async function submitWork(e) {
    e.preventDefault();
    setMessage("");

    if (!workFile) {
      setMessage("Выберите файл работы");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("lesson_id", selectedLesson.id);
      formData.append("work_file", workFile);

      const response = await fetch(`${API_URL}/works/`, {
        method: "POST",
        headers: {
          "current-user-id": user.id,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Ошибка отправки работы");
      }

      setMessage("Работа отправлена на проверку.");
      setWorkFile(null);
      await loadWorks();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function addToPortfolio(workId) {
    setMessage("");

    try {
      await request(`/portfolio/${workId}`, {
        method: "POST",
        headers: {
          "current-user-id": user.id,
        },
      });

      setMessage("Работа добавлена в портфолио.");
      await loadPortfolio();
      await loadWorks();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <main className="dashboard">
      <nav className="sidebar">
        <button
          className="sidebar-btn"
          onClick={() => setPage("lessons")}
        >
          Мои уроки
        </button>

        <button
          className="sidebar-btn"
          onClick={() => setPage("portfolio")}
        >
          Портфолио
        </button>
      </nav>

      <section className="content-grid">
        <Alert
          message={message}
          type={
            message.includes("добавлена") || message.includes("отправлена")
              ? "success"
              : "error"
          }
        />

        {page === "lessons" && (
          <section className="card wide">
            <div className="section-head">
              <div>
                <h2>Мои уроки</h2>
                <p>Откройте урок, посмотрите видео и отправьте работу.</p>
              </div>

              <button className="btn btn-light" onClick={() => {
                loadLessons();
                loadWorks();
              }}>
                Обновить
              </button>
            </div>

            {lessons.length === 0 && (
              <div className="empty">Нет доступных уроков.</div>
            )}

            <div className="lesson-grid">
              {lessons.map((lesson) => {
                const work = getWorkForLesson(lesson.id);

                return (
                  <article className="lesson-card" key={lesson.id}>
                    <div className="lesson-number">
                      Урок #{lesson.order_number}
                    </div>

                    <h3>{lesson.title}</h3>
                    <p>{lesson.description}</p>

                    {work ? (
                      <div className={`status ${work.status}`}>
                        {getStatusText(work.status)}
                      </div>
                    ) : (
                      <div className="status pending">
                        Работа не отправлена
                      </div>
                    )}

                    <button
                      className="btn btn-primary"
                      onClick={() => setSelectedLesson(lesson)}
                    >
                      Открыть урок
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {page === "portfolio" && (
          <section className="card wide">
            <div className="section-head">
              <div>
                <h2>Портфолио</h2>
                <p>Работы, добавленные после успешного оценивания.</p>
              </div>

              <button className="btn btn-light" onClick={loadPortfolio}>
                Обновить
              </button>
            </div>

            {portfolio.length === 0 && (
              <div className="empty">Портфолио пока пустое.</div>
            )}

            <div className="table">
              {portfolio.map((item) => (
                <div className="table-row four" key={item.id}>
                  <span>Позиция #{item.id}</span>
                  <b>Работа #{item.work_id}</b>
                  <span>Студент #{item.student_id}</span>
                  <span>{new Date(item.added_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </section>

      {selectedLesson && (
        <Modal
          title={selectedLesson.title}
          onClose={() => setSelectedLesson(null)}
        >
          <LessonModalContent
            lesson={selectedLesson}
            updateWork={updateWork}
            deleteWork={deleteWork}
            work={getWorkForLesson(selectedLesson.id)}
            workFile={workFile}
            setWorkFile={setWorkFile}
            submitWork={submitWork}
            addToPortfolio={addToPortfolio}
            getStatusText={getStatusText}
          />
        </Modal>
      )}
    </main>
  );
}

function LessonModalContent({
  lesson,
  work,
  workFile,
  setWorkFile,
  submitWork,
  updateWork,
  deleteWork,
  addToPortfolio,
  getStatusText,
}) {
  const videoSrc = `${API_URL}${lesson.video_path}`;

  return (
    <div>
      <div className="video-player-box">
        <video className="lesson-video" src={videoSrc} controls>
          Ваш браузер не поддерживает видео.
        </video>
      </div>

      <p>{lesson.description}</p>

      {!work && (
        <form onSubmit={submitWork}>
          <label>
            Загрузить практическую работу
            <input
              type="file"
              onChange={(e) => setWorkFile(e.target.files[0])}
            />
          </label>

          {workFile && (
            <div className="file-selected">
              Выбран файл: {workFile.name}
            </div>
          )}

          <button className="btn btn-primary">
            Отправить работу
          </button>
        </form>
      )}

      {work && (
        <div className="work-status-box">
          <h3>Работа по уроку</h3>

          <p>
            <b>Файл:</b> {work.file_path}
          </p>

          <p>
            <b>Статус:</b>{" "}
            <span className={`status ${work.status}`}>
              {getStatusText(work.status)}
            </span>
          </p>

          {work.status !== "completed" && (
            <>
              <label>
                Новый файл работы
                <input
                  type="file"
                  onChange={(e) => setWorkFile(e.target.files[0])}
                />
              </label>

              <div className="actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => updateWork(work.id)}
                >
                  Изменить работу
                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => deleteWork(work.id)}
                >
                  Удалить работу
                </button>
              </div>
            </>
          )}

          {work.status === "completed" && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => addToPortfolio(work.id)}
            >
              Добавить в портфолио
            </button>
          )}

          {work.status === "not_completed" && (
            <p className="hint">
              Работа оценена как «Не выполнено». Вы можете загрузить исправленный файл.
            </p>
          )}
        </div>
      )}
    </div>
  );
}