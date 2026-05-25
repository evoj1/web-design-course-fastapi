import React, { useEffect, useState } from "react";
import { request } from "../api/api.js";
import Alert from "../components/Alert.jsx";
import Modal from "../components/Modal.jsx";

export default function CuratorDashboard({ user }) {
  const [works, setWorks] = useState([]);
  const [selectedWork, setSelectedWork] = useState(null);
  const [status, setStatus] = useState("completed");
  const [comment, setComment] = useState("Работа выполнена корректно.");
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

  async function loadWorks() {
    setWorks(
      await request("/works/", {
        headers: {
          "current-user-id": user.id,
          "current-role": "curator",
        },
      })
    );
  }

  useEffect(() => {
    loadWorks().catch((err) => error(err.message));
  }, []);

  async function reviewWork(event) {
    event.preventDefault();
    setIsLoading(true);

    try {
      await request("/works/review", {
        method: "POST",
        headers: {
          "current-user-id": user.id,
          "current-role": "curator",
        },
        body: JSON.stringify({
          work_id: selectedWork.id,
          status,
          comment: comment.trim(),
        }),
      });

      setSelectedWork(null);
      success("Оценка сохранена. Статус работы обновлён.");
      await loadWorks();
    } catch (err) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function openModal(work) {
    setSelectedWork(work);
    setStatus(work.status === "not_completed" ? "not_completed" : "completed");
    setComment("Работа выполнена корректно.");
  }

  function getStatusText(value) {
    if (value === "pending") return "Не оценено";
    if (value === "completed") return "Выполнено";
    if (value === "not_completed") return "Не выполнено";
    return value;
  }

  return (
    <main className="panel-layout">
      <aside className="side-menu">
        <a href="#works">Работы студентов</a>
      </aside>

      <section className="workspace">
        <Alert message={message} type={messageType} onClose={() => setMessage("")} />

        <section className="content-card" id="works">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Панель куратора</p>
              <h2>Работы студентов</h2>
              <span>Проверка отправленных практических работ.</span>
            </div>

            <button className="btn btn-muted" onClick={loadWorks}>Обновить</button>
          </div>

          {works.length === 0 && <div className="empty">Нет работ на проверке.</div>}

          <div className="works-list">
            {works.map((work) => (
              <article className="work-item" key={work.id}>
                <div>
                  <h3>Работа #{work.id} · Урок #{work.lesson_id}</h3>
                  <p>Студент #{work.student_id}</p>
                  <span className="path-label">{work.file_path}</span>
                </div>

                <span className={`status-badge ${work.status}`}>{getStatusText(work.status)}</span>

                <button className="btn btn-green" onClick={() => openModal(work)}>
                  Оценить работу
                </button>
              </article>
            ))}
          </div>
        </section>
      </section>

      {selectedWork && (
        <Modal title={`Оценить работу #${selectedWork.id}`} onClose={() => setSelectedWork(null)}>
          <form onSubmit={reviewWork}>
            <div className="review-summary">
              <p><b>Студент:</b> #{selectedWork.student_id}</p>
              <p><b>Урок:</b> #{selectedWork.lesson_id}</p>
              <p><b>Файл:</b> {selectedWork.file_path}</p>
            </div>

            <label>
              Статус работы
              <div className="radio-row">
                <label className="radio-card">
                  <input type="radio" checked={status === "completed"} onChange={() => setStatus("completed")} />
                  Выполнено
                </label>

                <label className="radio-card">
                  <input type="radio" checked={status === "not_completed"} onChange={() => setStatus("not_completed")} />
                  Не выполнено
                </label>
              </div>
            </label>

            <label>
              Комментарий куратора
              <textarea value={comment} onChange={(event) => setComment(event.target.value)} required />
            </label>

            <div className="modal-actions">
              <button type="button" className="btn btn-muted" onClick={() => setSelectedWork(null)}>
                Отмена
              </button>
              <button className="btn btn-green" disabled={isLoading}>
                {isLoading ? "Сохранение..." : "Сохранить оценку"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
