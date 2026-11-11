import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[parseInt(parts[1], 10) - 1];
      const day = parseInt(parts[2], 10);
      return `${month} ${day}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-chart-tooltip">
        <p className="tooltip-date">{formatDateLabel(label)}</p>
        <p className="tooltip-clicks">
          <strong>{payload[0].value}</strong> {payload[0].value === 1 ? "click" : "clicks"}
        </p>
      </div>
    );
  }
  return null;
};

export default function ClicksChart({ data = [], title = "Clicks Over Time", color = "#2563eb" }) {
  const hasData = Array.isArray(data) && data.length > 0;
  const maxClicks = hasData ? Math.max(...data.map((d) => d.clicks || 0), 0) : 0;
  const yAxisMax = Math.max(maxClicks + 1, 5);

  return (
    <div className="chart-card card">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        <span className="chart-badge">{data.length} Days</span>
      </div>

      <div className="chart-container" style={{ width: "100%", height: 280 }}>
        {!hasData ? (
          <div className="chart-empty-state">No click data available yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateLabel}
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#cbd5e1" }}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, yAxisMax]}
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#cbd5e1" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="clicks"
                stroke={color}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#gradient-${color.replace("#", "")})`}
                activeDot={{ r: 6, fill: color, stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
