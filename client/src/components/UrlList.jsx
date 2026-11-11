import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";

export default function UrlList({
  urls = [],
  onDeleteUrl,
  onSelectUrl,
  onOpenQr,
  selectedUrlId,
  loading = false,
  isFiltered = false,
  onClearFilters,
}) {
  const toast = useToast();
  const [copiedId, setCopiedId] = useState(null);

  async function handleCopy(urlObj, e) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(urlObj.shortUrl);
      setCopiedId(urlObj._id);
      toast.success("Short link copied!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  function formatDate(isoString) {
    if (!isoString) return "Never";
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

  if (urls.length === 0 && !loading) {
    if (isFiltered) {
      return (
        <div className="card empty-state-card">
          <div className="empty-state-icon">🔍</div>
          <h3>No matching links found</h3>
          <p>Try adjusting your search query or status filter.</p>
          {onClearFilters && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClearFilters}
            >
              Clear Filters
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="card empty-state-card">
        <div className="empty-state-icon">🔗</div>
        <h3>No short links yet</h3>
        <p>Shorten your first URL on the Home page to start tracking clicks and analytics.</p>
        <Link to="/" className="btn btn-primary">
          Create Short Link
        </Link>
      </div>
    );
  }

  return (
    <div className="card url-list-card">
      <div className="table-responsive">
        <table className="url-table">
          <thead>
            <tr>
              <th>Short Code / URL</th>
              <th>Original URL</th>
              <th>Created</th>
              <th>Expires</th>
              <th>Status</th>
              <th>Clicks</th>
              <th className="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {urls.map((u) => {
              const isSelected = selectedUrlId === u._id;
              const isCopied = copiedId === u._id;
              const isExpired = u.status === "expired";

              return (
                <tr
                  key={u._id}
                  className={`url-row ${isSelected ? "row-selected" : ""} ${
                    isExpired ? "row-expired" : ""
                  }`}
                  onClick={() => onSelectUrl && onSelectUrl(u)}
                >
                  <td className="td-shorturl">
                    <div className="shorturl-badge-group">
                      <a
                        href={u.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="table-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        /{u.shortCode}
                      </a>
                      {u.isCustom && <span className="custom-alias-tag">custom</span>}
                    </div>
                  </td>
                  <td className="td-originalurl" title={u.originalUrl}>
                    <span className="truncate-text">{u.originalUrl}</span>
                  </td>
                  <td className="td-date">{formatDate(u.createdAt)}</td>
                  <td className="td-date">{formatDate(u.expiresAt)}</td>
                  <td className="td-status">
                    <span className={`status-badge ${isExpired ? "status-expired" : "status-active"}`}>
                      {isExpired ? "Expired" : "Active"}
                    </span>
                  </td>
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
                        aria-label={`Copy link for ${u.shortCode}`}
                      >
                        {isCopied ? "✓" : "Copy"}
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-qr-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenQr && onOpenQr(u);
                        }}
                        title="QR Code"
                        aria-label={`View QR for ${u.shortCode}`}
                      >
                        QR
                      </button>
                      <button
                        type="button"
                        className={`btn-action btn-stats-sm ${isSelected ? "active" : ""}`}
                        onClick={() => onSelectUrl && onSelectUrl(u)}
                        title="Analytics & CSV"
                        aria-label={`View stats for ${u.shortCode}`}
                      >
                        Stats
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-delete-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteUrl && onDeleteUrl(u);
                        }}
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
