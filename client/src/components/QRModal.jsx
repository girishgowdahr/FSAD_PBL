import React, { useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function QRModal({ isOpen, onClose, url, shortCode }) {
  const modalRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      modalRef.current?.focus();
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !url) return null;

  function handleDownload() {
    const canvas = document.getElementById("qr-canvas-element");
    if (!canvas) return;

    const pngUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = `${shortCode || "link"}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card qr-modal-card text-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-modal-title"
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="qr-modal-title" className="modal-title">
            QR Code for /{shortCode}
          </h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close QR dialog"
          >
            ×
          </button>
        </div>

        <div className="modal-body qr-modal-body">
          <div className="qr-canvas-container">
            <QRCodeCanvas
              id="qr-canvas-element"
              value={url}
              size={256}
              bgColor="#ffffff"
              fgColor="#000000"
              level="H"
              marginSize={2}
            />
          </div>
          <p className="qr-link-text">{url}</p>
        </div>

        <div className="modal-footer qr-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownload}
          >
            📥 Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}
