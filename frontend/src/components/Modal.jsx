import React, { useEffect } from "react";

export default function Modal({ title, children, onClose, size = "default" }) {
  useEffect(() => {
    function closeByEsc(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", closeByEsc);
    document.body.classList.add("modal-open");

    return () => {
      document.removeEventListener("keydown", closeByEsc);
      document.body.classList.remove("modal-open");
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <section
        className={`modal-window modal-${size}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-title-row">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {children}
      </section>
    </div>
  );
}
