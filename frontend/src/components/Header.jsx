import React from "react";

const roleNames = {
  manager: "Менеджер",
  curator: "Куратор",
  student: "Студент",
};

export default function Header({ user, onLogout }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Онлайн-курс</p>
        <h1>Основы веб-дизайна и UX/UI</h1>
      </div>

      <div className="topbar-user">
        <div>
          <strong>{user.full_name}</strong>
          <span>{user.email}</span>
          <b>{roleNames[user.role] || user.role}</b>
        </div>

        <button className="btn btn-exit" onClick={onLogout}>
          Выйти
        </button>
      </div>
    </header>
  );
}
