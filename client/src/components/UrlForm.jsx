import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createUrl, getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import QRModal from "./QRModal";

export default function UrlForm({ onUrlCreated }) {
  const { token } = useAuth();
  const toast = useToast();

  const [originalUrl, setOriginalUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdData, setCreatedData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  // Compute min and max for datetime-local
  const now = new Date();
  const minDateTime = new Date(now.getTime() + 60000).toISOString().slice(0, 16);
  const maxDateTime = new Date(now.getTime() + 365 * 86400000).toISOString().slice(0, 16);

  function validateInput() {
    if (!originalUrl || !originalUrl.trim()) {
      return "Please enter a URL to shorten";
    }
    const trimmed = originalUrl.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      return "URL must begin with http:// or https://";
    }
    try {
      new URL(trimmed);
    } catch {
      return "Please enter a valid URL (e.g. https://example.com)";
    }

    if (customAlias && customAlias.trim()) {
      const alias = customAlias.trim();
      if (alias.length < 4 || alias.length > 20) {
        return "Custom alias must be between 4 and 20 characters";
      }
      if (!/^[A-Za-z0-9_-]+$/.test(alias)) {
        return "Custom alias can only contain letters, numbers, underscores, and hyphens";
      }
    }

    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const validationError = validateInput();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      const isoExpiry = expiresAt ? new Date(expiresAt).toISOString() : null;
      const res = await createUrl({
        originalUrl: originalUrl.trim(),
        customAlias: customAlias.trim(),
        expiresAt: isoExpiry,
      });

      setCreatedData(res.data);
      setOriginalUrl("");
      setCustomAlias("");
      setExpiresAt("");
      setShowAdvanced(false);
      toast.success("Short URL created successfully!");

      if (onUrlCreated) {
        onUrlCreated(res.data);
      }
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!createdData?.shortUrl) return;
    try {
      await navigator.clipboard.writeText(createdData.shortUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  }

  return (
    <div className="url-form-container card">
      <form onSubmit={handleSubmit} className="url-form" noValidate>
        <div className="input-group">
          <input
            type="url"
            className={`url-input ${error ? "has-error" : ""}`}
            placeholder="Enter long link here (e.g. https://example.com/very-long-path)"
            value={originalUrl}
            onChange={(e) => {
              setOriginalUrl(e.target.value);
              if (error) setError("");
            }}
            disabled={loading}
            aria-label="URL to shorten"
            required
          />
          <button
            type="submit"
            className="btn btn-primary shorten-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-wrapper">
                <span className="spinner"></span> Shortening...
              </span>
            ) : (
              "Shorten URL"
            )}
          </button>
        </div>

        {error && (
          <div className="form-error-msg" role="alert">
            <span className="error-icon">⚠️</span> {error}
          </div>
        )}

        {/* Advanced Options Accordion */}
        <div className="advanced-options-wrapper">
          <button
            type="button"
            className="btn-toggle-advanced"
            onClick={() => setShowAdvanced(!showAdvanced)}
            aria-expanded={showAdvanced}
          >
            <span>⚙️ {showAdvanced ? "Hide Advanced Options" : "Advanced Options (Alias & Expiry)"}</span>
            <span className="toggle-chevron">{showAdvanced ? "▲" : "▼"}</span>
          </button>

          {showAdvanced && (
            <div className="advanced-options-panel">
              {!token ? (
                <div className="guest-advanced-notice">
                  <span>🔒 Custom aliases and link expiration require an account.</span>
                  <Link to="/login" className="notice-login-link">
                    Log in to unlock
                  </Link>
                </div>
              ) : (
                <div className="advanced-inputs-grid">
                  <div className="form-field">
                    <label htmlFor="custom-alias-input" className="form-label">
                      Custom Alias (Optional)
                    </label>
                    <div className="input-with-prefix">
                      <span className="input-prefix">/</span>
                      <input
                        id="custom-alias-input"
                        type="text"
                        className="form-control"
                        placeholder="e.g. summer-sale"
                        value={customAlias}
                        onChange={(e) => setCustomAlias(e.target.value)}
                        maxLength={20}
                      />
                    </div>
                    <small className="form-hint">4-20 chars: letters, numbers, _, -</small>
                  </div>

                  <div className="form-field">
                    <div className="label-with-clear">
                      <label htmlFor="expiry-input" className="form-label">
                        Link Expiry (Optional)
                      </label>
                      {expiresAt && (
                        <button
                          type="button"
                          className="btn-clear-date"
                          onClick={() => setExpiresAt("")}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      id="expiry-input"
                      type="datetime-local"
                      className="form-control"
                      value={expiresAt}
                      min={minDateTime}
                      max={maxDateTime}
                      onChange={(e) => setExpiresAt(e.target.value)}
                    />
                    <small className="form-hint">Links expire and return 410 after this date</small>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </form>

      {/* Result Box */}
      {createdData && (
        <div className="result-box">
          <div className="result-header">
            <span className="badge-success">Success! Your short link is ready:</span>
            {createdData.expiresAt && (
              <span className="badge-expiry">
                Expires: {new Date(createdData.expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="result-content">
            <div className="result-link-display">
              <a
                href={createdData.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="short-link-anchor"
              >
                {createdData.shortUrl}
              </a>
              <span className="result-original-url" title={createdData.originalUrl}>
                Target: {createdData.originalUrl}
              </span>
            </div>
            <div className="result-actions">
              <button
                type="button"
                className={`btn btn-copy ${copied ? "btn-copied" : ""}`}
                onClick={handleCopy}
              >
                {copied ? "✓ Copied!" : "📋 Copy"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setQrOpen(true)}
              >
                📱 QR Code
              </button>
              <a
                href={createdData.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                🔗 Open
              </a>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {createdData && (
        <QRModal
          isOpen={qrOpen}
          onClose={() => setQrOpen(false)}
          url={createdData.shortUrl}
          shortCode={createdData.shortCode}
        />
      )}
    </div>
  );
}
