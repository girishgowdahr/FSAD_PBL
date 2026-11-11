import React, { useState, useEffect } from "react";

export default function SearchFilterBar({
  search,
  status,
  sort,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onExportCsv,
  onRefresh,
  refreshing = false,
  exporting = false,
}) {
  const [localSearch, setLocalSearch] = useState(search);

  // 400ms debounce for search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 400);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  return (
    <div className="search-filter-bar card">
      <div className="filter-group-main">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by code or original URL..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            aria-label="Search links"
          />
          {localSearch && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => {
                setLocalSearch("");
                onSearchChange("");
              }}
              aria-label="Clear search text"
            >
              ×
            </button>
          )}
        </div>

        <div className="select-filters">
          <select
            className="filter-select"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            aria-label="Filter by link status"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="expired">Expired Only</option>
          </select>

          <select
            className="filter-select"
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="Sort links by"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="clicks">Most Clicks</option>
          </select>
        </div>
      </div>

      <div className="filter-actions">
        <button
          type="button"
          className="btn btn-secondary btn-export"
          onClick={onExportCsv}
          disabled={exporting}
          title="Export analytics as CSV"
        >
          {exporting ? "Exporting..." : "📊 Export CSV"}
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-refresh"
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh link records"
        >
          {refreshing ? "Refreshing..." : "🔄 Refresh"}
        </button>
      </div>
    </div>
  );
}
