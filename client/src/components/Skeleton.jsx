import React from "react";

export function SkeletonBox({ width = "100%", height = "20px", borderRadius = "6px", className = "" }) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
}

export function MetricsSkeleton() {
  return (
    <div className="metrics-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card analytics-card">
          <SkeletonBox width="40%" height="16px" />
          <SkeletonBox width="60%" height="32px" />
          <SkeletonBox width="80%" height="14px" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="card table-skeleton-wrapper">
      <SkeletonBox width="30%" height="24px" className="mb-3" />
      <div className="skeleton-rows">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton-row-item">
            <SkeletonBox width="25%" height="18px" />
            <SkeletonBox width="45%" height="18px" />
            <SkeletonBox width="10%" height="18px" />
            <SkeletonBox width="15%" height="18px" />
          </div>
        ))}
      </div>
    </div>
  );
}
