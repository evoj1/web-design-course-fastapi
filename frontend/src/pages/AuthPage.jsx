import React, { useState } from "react";
import { request } from "../api/api.js";
import Alert from "../components/Alert.jsx";

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMessage("");
    try {
      const user = mode === "register"
        ? await request("/auth/register", { method: "POST", body: JSON.stringify({ full_name: fullName, email, password }) })
        : await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      onAuth(user);
    } catch (err) { setMessage(err.message); }
  }

  return (
    <main className="auth-layout">
      <section className="auth-left">
        <div>Основы UX/UI дизаайна</div>
        <h1>Основы UX/UI дизаайна</h1>
        <p>Регистрация, авторизация, уроки, работы студентов, портфолио, оценивание и назначение кураторов.</p>
        <div className="feature-grid"><div>Студент<span>уроки и портфолио</span></div><div>Куратор<span>оценивание работ</span></div><div>Менеджер<span>уроки и роли</span></div></div>
      </section>
      <section className="auth-card">
        <div className="tabs">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Вход</button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Регистрация</button>
        </div>
        <h2>{mode === "login" ? "Авторизация" : "Регистрация"}</h2>
        <form onSubmit={submit}>
          {mode === "register" && <label>Имя пользователя<input value={fullName} onChange={(e) => setFullName(e.target.value)} /></label>}
          <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Пароль<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <Alert message={message} type="error" />
          <button className="btn btn-primary" type="submit">{mode === "login" ? "Войти" : "Зарегистрироваться"}</button>
        </form>
        <p className="hint">Новый пользователь получает роль student. Роль curator назначает менеджер.</p>
      </section>
    </main>
  );
}
