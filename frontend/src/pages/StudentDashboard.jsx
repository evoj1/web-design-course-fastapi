import React, { useEffect, useState } from "react";
import { API_URL, request } from "../api/api.js";
import Alert from "../components/Alert.jsx";
import Modal from "../components/Modal.jsx";

export default function StudentDashboard({ user }) {
  const [page, setPage] = useState("lessons");
  const [lessons, setLessons] = useState([]);
  const [works, setWorks] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [workFile, setWorkFile] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [isLoading, setIsLoading] = useState(false);

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

  async function loadWorks() {
    setWorks(await request("/works/my", { headers: { "current-user-id": user.id } }));
  }

  async function loadPortfolio() {
    setPortfolio(await request("/portfolio/", { headers: { "current-user-id": user.id } }));
  }

  useEffect(() => {
    loadLessons().catch((err) => error(err.message));
    loadWorks().catch((err) => error(err.message));
    loadPortfolio().catch((err) => error(err.message));
  }, []);

  function getWorkForLesson(lessonId) {
    return works.find((work) => work.lesson_id === lessonId);
  }

  function getStatusText(status) {
    if (status === "pending") return "Не оценено";
    if (status === "not_completed") return "Не выполнено";
    if (status === "completed") return "Выполнено";
    return status;
  }

  function canOpenLesson(index) {
    if (index === 0) return true;
    const previous = lessons[index - 1];
    const previousWork = previous ? getWorkForLesson(previous.id) : null;
    return previousWork?.status === "completed";
  }

  async function submitWork(event) {
    event.preventDefault();

    if (!workFile) {
      error("Выберите файл работы.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("lesson_id", selectedLesson.id);
      formData.append("work_file", workFile);

      const response = await fetch(`${API_URL}/works/`, {
        method: "POST",
        headers: { "current-user-id": user.id },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.detail)
            ? data.detail.map((item) => item.msg).join("; ")
            : data.detail || "Ошибка отправки работы."
        );
      }

      setSelectedLesson(null);
      setWorkFile(null);
      success("Работа отправлена на проверку.");
      await loadWorks();
    } catch (err) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateWork(workId) {
    if (!workFile) {
      error("Выберите новый файл работы.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("work_file", workFile);

      const response = await fetch(`${API_URL}/works/${workId}`, {
        method: "PUT",
        headers: { "current-user-id": user.id },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Ошибка изменения работы.");
      }

      setSelectedLesson(null);
      setWorkFile(null);
      success("Работа изменена и снова отправлена на проверку.");
      await loadWorks();
    } catch (err) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteWork(workId) {
    if (!confirm("Удалить отправленную работу?")) return;

    try {
      await request(`/works/${workId}`, {
        method: "DELETE",
        headers: { "current-user-id": user.id },
      });

      setSelectedLesson(null);
      success("Работа удалена.");
      await loadWorks();
    } catch (err) {
      error(err.message);
    }
  }

  async function addToPortfolio(workId) {
    setIsLoading(true);

    try {
      await request(`/portfolio/${workId}`, {
        method: "POST",
        headers: { "current-user-id": user.id },
      });

      setSelectedLesson(null);
      success("Работа добавлена в портфолио.");
      await loadPortfolio();
      await loadWorks();
    } catch (err) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="panel-layout">
      <aside className="side-menu">
        <button className={page === "lessons" ? "active" : ""} onClick={() => setPage("lessons")}>
          Мои уроки
        </button>
        <button className={page === "portfolio" ? "active" : ""} onClick={() => setPage("portfolio")}>
          Портфолио
        </button>
      </aside>

      <section className="workspace">
        <Alert message={message} type={messageType} onClose={() => setMessage("")} />

        {page === "lessons" && (
          <section className="content-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Панель студента</p>
                <h2>Мои уроки</h2>
                <span>Откройте урок, изучите видео и отправьте практическую работу.</span>
              </div>

              <button className="btn btn-muted" onClick={() => { loadLessons(); loadWorks(); }}>
                Обновить
              </button>
            </div>

            <div className="lesson-cards">
              {lessons.map((lesson, index) => {
                const work = getWorkForLesson(lesson.id);
                const available = canOpenLesson(index);

                return (
                  <article className={`lesson-tile ${available ? "" : "locked"}`} key={lesson.id}>
                    <div className="lesson-topline">
                      <b>Урок {lesson.order_number}</b>
                      {!available && <span>🔒</span>}
                    </div>

                    <h3>{lesson.title}</h3>
                    <p>{lesson.description}</p>

                    <span className={`status-badge ${work?.status || "available"}`}>
                      {work ? getStatusText(work.status) : available ? "Доступен" : "Заблокирован"}
                    </span>

                    <button
                      className="btn btn-primary"
                      disabled={!available}
                      onClick={() => {
                        setWorkFile(null);
                        setSelectedLesson(lesson);
                      }}
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
          <section className="content-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Портфолио</p>
                <h2>Мои работы</h2>
                <span>Здесь отображаются работы со статусом «Выполнено».</span>
              </div>

              <button className="btn btn-muted" onClick={loadPortfolio}>Обновить</button>
            </div>

            {portfolio.length === 0 && <div className="empty">Портфолио пока пустое.</div>}

            <div className="portfolio-grid">
              {portfolio.map((item) => (
                <article className="portfolio-card" key={item.id}>
                  <small>Позиция #{item.id}</small>
                  <h3>Работа #{item.work_id}</h3>
                  <p>Добавлена: {new Date(item.added_at).toLocaleString()}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>

      {selectedLesson && (
        <Modal
          title={selectedLesson.title}
          size="large"
          onClose={() => {
            setSelectedLesson(null);
            setWorkFile(null);
          }}
        >
          <LessonModal
            lesson={selectedLesson}
            work={getWorkForLesson(selectedLesson.id)}
            workFile={workFile}
            setWorkFile={setWorkFile}
            submitWork={submitWork}
            updateWork={updateWork}
            deleteWork={deleteWork}
            addToPortfolio={addToPortfolio}
            getStatusText={getStatusText}
            isLoading={isLoading}
          />
        </Modal>
      )}
    </main>
  );
}

function LessonModal({
  lesson,
  work,
  workFile,
  setWorkFile,
  submitWork,
  updateWork,
  deleteWork,
  addToPortfolio,
  getStatusText,
  isLoading,
}) {
  return (
    <div>
      <div className="video-frame">
        <video src={`${API_URL}${lesson.video_path}`} controls>
          Ваш браузер не поддерживает видео.
        </video>
      </div>

      <p className="lesson-description">{lesson.description}</p>

      {!work && (
        <form onSubmit={submitWork}>
          <label>
            Практическая работа
            <input type="file" onChange={(event) => setWorkFile(event.target.files[0])} required />
          </label>

          {workFile && <div className="selected-file">Выбран файл: {workFile.name}</div>}

          <div className="modal-actions">
            <button className="btn btn-primary" disabled={isLoading}>
              {isLoading ? "Отправка..." : "Добавить на проверку"}
            </button>
          </div>
        </form>
      )}

      {work && (
        <div className="work-box">
          <h3>Практическая работа</h3>
          <p><b>Файл:</b> {work.file_path}</p>
          <p><b>Статус:</b> <span className={`status-badge ${work.status}`}>{getStatusText(work.status)}</span></p>

          {work.status !== "completed" && (
            <>
              <label>
                Новый файл работы
                <input type="file" onChange={(event) => setWorkFile(event.target.files[0])} />
              </label>

              {workFile && <div className="selected-file">Выбран файл: {workFile.name}</div>}

              <div className="modal-actions">
                <button type="button" className="btn btn-muted" onClick={() => deleteWork(work.id)}>
                  Удалить работу
                </button>
                <button type="button" className="btn btn-primary" onClick={() => updateWork(work.id)} disabled={isLoading}>
                  {isLoading ? "Сохранение..." : "Изменить работу"}
                </button>
              </div>
            </>
          )}

          {work.status === "completed" && (
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => addToPortfolio(work.id)} disabled={isLoading}>
                {isLoading ? "Добавление..." : "Добавить в портфолио"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
