import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function UrlList({
  urls = [],
  onDeleteUrl,
  onSelectUrl,
  selectedUrlId,
  loading = false,
}) {
  const [copiedId, setCopiedId] = useState(null);

  async function handleCopy(urlObj, e) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(urlObj.shortUrl);
      setCopiedId(urlObj._id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  function handleDelete(urlObj, e) {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Are you sure you want to delete short link "${urlObj.shortCode}"?\nTarget: ${urlObj.originalUrl}`
    );
    if (confirmed && onDeleteUrl) {
      onDeleteUrl(urlObj._id);
    }
  }

  function formatDate(isoString) {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  }

  if (loading && urls.length === 0) {
    return (
      <div className="card loading-card">
        <div className="spinner"></div>
        <p>Loading links...</p>
      </div>
    );
  }

  if (!loading && urls.length === 0) {
    return (
      <div className="card empty-state-card">
        <div className="empty-state-icon">🔗</div>
        <h3>No links yet</h3>
        <p>You haven't shortened any URLs yet. Create your first short link to see it here.</p>
        <Link to="/" className="btn btn-primary">
          Create Short Link
        </Link>
      </div>
    );
  }

  return (
    <div className="card url-list-card">
      <div className="table-header-row">
        <h3 className="section-title">All Short Links ({urls.length})</h3>
        <span className="table-hint">Click "Stats" to view 30-day analytics</span>
      </div>

      <div className="table-responsive">
        <table className="url-table">
          <thead>
            <tr>
              <th>Short URL</th>
              <th>Original URL</th>
              <th>Created</th>
              <th>Clicks</th>
              <th className="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {urls.map((u) => {
              const isSelected = selectedUrlId === u._id;
              const isCopied = copiedId === u._id;

              return (
                <tr
                  key={u._id}
                  className={`url-row ${isSelected ? "row-selected" : ""}`}
                  onClick={() => onSelectUrl && onSelectUrl(u)}
                >
                  <td className="td-shorturl">
                    <a
                      href={u.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="table-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {u.shortUrl}
                    </a>
                  </td>
                  <td className="td-originalurl" title={u.originalUrl}>
                    <span className="truncate-text">{u.originalUrl}</span>
                  </td>
                  <td className="td-date">{formatDate(u.createdAt)}</td>
                  <td className="td-clicks">
                    <span className="click-pill">{u.clicks}</span>
                  </td>
                  <td className="td-actions" onClick={(e) => e.stopPropagation()}>
                    <div className="action-buttons-group">
                      <button
                        type="button"
                        className={`btn-action btn-copy-sm ${isCopied ? "btn-copied" : ""}`}
                        onClick={(e) => handleCopy(u, e)}
                        title="Copy short link"
                        aria-label={`Copy short link for ${u.shortCode}`}
                      >
                        {isCopied ? "✓" : "Copy"}
                      </button>
                      <button
                        type="button"
                        className={`btn-action btn-stats-sm ${isSelected ? "active" : ""}`}
                        onClick={() => onSelectUrl && onSelectUrl(u)}
                        title="View analytics"
                        aria-label={`View stats for ${u.shortCode}`}
                      >
                        Stats
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-delete-sm"
                        onClick={(e) => handleDelete(u, e)}
                        title="Delete URL"
                        aria-label={`Delete link ${u.shortCode}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
