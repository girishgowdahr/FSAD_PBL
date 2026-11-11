import React, { useEffect, useRef } from "react";

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDanger = true,
  onConfirm,
  onCancel,
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onCancel();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      modalRef.current?.focus();
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="confirm-modal-title" className="modal-title">
            {title}
          </h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onCancel}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${isDanger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
