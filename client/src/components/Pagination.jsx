import React from "react";

export default function Pagination({ page = 1, totalPages = 1, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <nav className="pagination-container" aria-label="Pagination navigation">
      <button
        type="button"
        className="btn-page-nav"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        &larr; Prev
      </button>

      <div className="page-numbers">
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`btn-page-number ${p === page ? "active" : ""}`}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="btn-page-nav"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        Next &rarr;
      </button>
    </nav>
  );
}
