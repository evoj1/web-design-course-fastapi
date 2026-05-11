import React from "react";
export default function Header({ user, onLogout }) {
  const names = { student: "Студент", curator: "Куратор", manager: "Менеджер" };
  return (
    <header className="header">
      <div><div className="badge">Онлайн-курс</div><h1>Основы веб-дизайна и UX/UI</h1><p>Система обучения, проверки работ и ведения портфолио</p></div>
      <div className="user-card"><b>{user.full_name}</b><span>{user.email}</span><span className="role">{names[user.role] || user.role}</span><button className="btn btn-light" onClick={onLogout}>Выйти</button></div>
    </header>
  );
}
