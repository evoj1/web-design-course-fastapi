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

  async function loadWorks() {
  setWorks(await request("/works/", {
    headers: {
      "current-user-id": user.id,
      "current-role": "curator",
    },
  }));
}

  async function reviewWork(e) {
  e.preventDefault();
  setMessage("");

  try {
    await request("/works/review", {
      method: "POST",
      headers: {
        "current-user-id": user.id,
        "current-role": "curator",
      },
      body: JSON.stringify({
        work_id: selectedWork.id,
        status: status,
        comment: comment,
      }),
    });

    setMessage("Оценка сохранена. Статус работы обновлён.");
    setSelectedWork(null);
    await loadWorks();
  } catch (err) {
    setMessage(err.message);
  }
}

  return (
    <main className="dashboard">
      <nav className="sidebar"><a href="#works">Работы студентов</a></nav>
      <section className="content-grid">
        <Alert message={message} type={message.includes("сохранена") ? "success" : "error"} />
        <section className="card wide" id="works">
          <div className="section-head"><div><h2>Работы студентов</h2><p>Куратор просматривает и оценивает отправленные работы.</p></div><button className="btn btn-light" onClick={loadWorks}>Обновить</button></div>
          {works.length === 0 && <div className="empty">Нет работ на проверке.</div>}
          <div className="table">{works.map(w => <div className="table-row" key={w.id}><span>Работа #{w.id}</span><b>Урок #{w.lesson_id}</b><span>Студент #{w.student_id}</span><span className={`status ${w.status}`}>{w.status}</span><button className="btn btn-primary" onClick={()=>setSelectedWork(w)}>Оценить</button></div>)}</div>
        </section>
      </section>
      {selectedWork && <Modal title={`Оценить работу #${selectedWork.id}`} onClose={()=>setSelectedWork(null)}><form onSubmit={reviewWork}><div className="info-box"><p><b>Студент:</b> #{selectedWork.student_id}</p><p><b>Урок:</b> #{selectedWork.lesson_id}</p><p><b>Файл:</b> {selectedWork.file_path}</p></div><label>Статус<select value={status} onChange={e=>setStatus(e.target.value)}><option value="completed">Выполнено</option><option value="not_completed">Не выполнено</option></select></label><label>Комментарий<textarea value={comment} onChange={e=>setComment(e.target.value)} /></label><button className="btn btn-primary">Сохранить оценку</button></form></Modal>}
    </main>
  );
}
