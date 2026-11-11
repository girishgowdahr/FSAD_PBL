import React, { useState } from "react";
import { createUrl, getErrorMessage } from "../services/api";

export default function UrlForm({ onUrlCreated }) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdData, setCreatedData] = useState(null);
  const [copied, setCopied] = useState(false);

  function validateInput(url) {
    if (!url || !url.trim()) {
      return "Please enter a URL to shorten";
    }
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      return "URL must begin with http:// or https://";
    }
    try {
      new URL(trimmed);
    } catch {
      return "Please enter a valid URL (e.g. https://example.com)";
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const validationError = validateInput(originalUrl);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const response = await createUrl(originalUrl.trim());
      setCreatedData(response.data);
      setOriginalUrl("");
      if (onUrlCreated) {
        onUrlCreated(response.data);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!createdData?.shortUrl) return;
    try {
      await navigator.clipboard.writeText(createdData.shortUrl);
      setCopied(true);
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
      </form>

      {createdData && (
        <div className="result-box">
          <div className="result-header">
            <span className="badge-success">Success! Your short link is ready:</span>
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
    </div>
  );
}
