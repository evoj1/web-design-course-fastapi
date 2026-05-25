import React, { useState } from "react";
import AuthPage from "./pages/AuthPage.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import CuratorDashboard from "./pages/CuratorDashboard.jsx";
import ManagerDashboard from "./pages/ManagerDashboard.jsx";
import Header from "./components/Header.jsx";

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("course_user");

    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem("course_user");
      return null;
    }
  });

  function handleAuth(userData) {
    setUser(userData);
    localStorage.setItem("course_user", JSON.stringify(userData));
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("course_user");
  }

  if (!user) {
    return <AuthPage onAuth={handleAuth} />;
  }

  return (
    <div className="app-shell">
      <Header user={user} onLogout={logout} />

      {user.role === "manager" && <ManagerDashboard user={user} />}
      {user.role === "curator" && <CuratorDashboard user={user} />}
      {user.role === "student" && <StudentDashboard user={user} />}
    </div>
  );
}
