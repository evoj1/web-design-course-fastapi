import React, { useState } from "react";
import { request } from "../api/api.js";
import Alert from "../components/Alert.jsx";

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const user =
        mode === "register"
          ? await request("/auth/register", {
              method: "POST",
              body: JSON.stringify({
                full_name: fullName.trim(),
                email: email.trim(),
                password,
              }),
            })
          : await request("/auth/login", {
              method: "POST",
              body: JSON.stringify({
                email: email.trim(),
                password,
              }),
            });

      onAuth(user);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="landing-page">
      <section className="landing-info">
        <span className="landing-chip">UX/UI COURSE</span>
        <h1>Основы веб-дизайна и UX/UI</h1>
        <p>
          Учебная система для просмотра видеоуроков, отправки практических работ
          и формирования портфолио студента.
        </p>

        <div className="landing-points">
          <div>Просмотр материалов курса</div>
          <div>Отправка практических работ</div>
          <div>Проверка работ куратором</div>
          <div>Формирование портфолио</div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
            type="button"
          >
            Вход
          </button>

          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => {
              setMode("register");
              setMessage("");
            }}
            type="button"
          >
            Регистрация
          </button>
        </div>

        <h2>{mode === "login" ? "Вход" : "Регистрация"}</h2>
        <p className="subtle">
          {mode === "login"
            ? "Введите данные учётной записи."
            : "Создайте аккаунт студента для прохождения курса."}
        </p>

        <Alert message={message} type="error" onClose={() => setMessage("")} />

        <form onSubmit={submit}>
          {mode === "register" && (
            <label>
              Имя
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Введите имя"
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@mail.com"
              required
            />
          </label>

          <label>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Введите пароль"
              required
            />
          </label>

          <button className="btn btn-primary btn-full" disabled={isLoading}>
            {isLoading
              ? "Подождите..."
              : mode === "login"
              ? "Войти"
              : "Зарегистрироваться"}
          </button>
        </form>
      </section>
    </main>
  );
}
