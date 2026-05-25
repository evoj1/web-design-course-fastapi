import React from "react";

export default function Alert({ message, type = "info", onClose }) {
  if (!message) return null;

  const title =
    type === "success" ? "Успешно" : type === "error" ? "Ошибка" : "Сообщение";

  return (
    <div className={`alert alert-${type}`}>
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>

      {onClose && (
        <button type="button" className="alert-close" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
}
