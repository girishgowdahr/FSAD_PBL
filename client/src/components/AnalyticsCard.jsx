import React from "react";

export default function AnalyticsCard({ title, value, subtitle, icon, variant = "default" }) {
  return (
    <div className={`analytics-card card card-${variant}`}>
      <div className="card-top">
        <span className="card-title">{title}</span>
        {icon && <span className="card-icon">{icon}</span>}
      </div>
      <div className="card-body">
        <h3 className="card-value">{value}</h3>
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}
