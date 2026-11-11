import React, { useEffect, useState, useCallback } from "react";
import AnalyticsCard from "../components/AnalyticsCard";
import ClicksChart from "../components/ClicksChart";
import UrlList from "../components/UrlList";
import {
  getSummary,
  getUrls,
  deleteUrl,
  getUrlAnalytics,
  getErrorMessage,
} from "../services/api";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Per-link analytics state
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [linkAnalytics, setLinkAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const [summaryRes, urlsRes] = await Promise.all([
        getSummary(),
        getUrls(),
      ]);
      setSummary(summaryRes.data);
      setUrls(urlsRes.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load single URL analytics
  const handleSelectUrl = async (urlObj) => {
    if (selectedUrl?._id === urlObj._id) {
      // Toggle off if already selected
      setSelectedUrl(null);
      setLinkAnalytics(null);
      return;
    }

    setSelectedUrl(urlObj);
    setLoadingAnalytics(true);
    setAnalyticsError("");

    try {
      const res = await getUrlAnalytics(urlObj._id);
      setLinkAnalytics(res.data);
    } catch (err) {
      setAnalyticsError(getErrorMessage(err));
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleDeleteUrl = async (id) => {
    try {
      await deleteUrl(id);
      if (selectedUrl?._id === id) {
        setSelectedUrl(null);
        setLinkAnalytics(null);
      }
      // Refresh list and summary
      await fetchData(true);
    } catch (err) {
      alert("Failed to delete link: " + getErrorMessage(err));
    }
  };

  const topLink = summary?.topLinks && summary.topLinks.length > 0 ? summary.topLinks[0] : null;

  return (
    <div className="page-container dashboard-page">
      <div className="dashboard-header-row">
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Track short link performance and visitor engagement</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary refresh-btn"
          onClick={() => {
            fetchData(true);
            if (selectedUrl) {
              handleSelectUrl(selectedUrl);
            }
          }}
          disabled={refreshing || loading}
        >
          {refreshing ? "Refreshing..." : "🔄 Refresh Data"}
        </button>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <span className="error-icon">⚠️</span> {error}
        </div>
      )}

      {/* Metrics Row */}
      <section className="metrics-grid">
        <AnalyticsCard
          title="Total Links"
          value={loading && !summary ? "..." : summary?.totalLinks ?? 0}
          subtitle="All active shortened URLs"
          icon="🔗"
          variant="primary"
        />
        <AnalyticsCard
          title="Total Clicks"
          value={loading && !summary ? "..." : summary?.totalClicks ?? 0}
          subtitle="Aggregated visitor redirects"
          icon="📈"
          variant="success"
        />
        <AnalyticsCard
          title="Top Link"
          value={
            loading && !summary
              ? "..."
              : topLink
              ? `${topLink.clicks} clicks`
              : "None yet"
          }
          subtitle={
            topLink
              ? `/${topLink.shortCode} • ${topLink.originalUrl.slice(0, 30)}...`
              : "Generate clicks to see top rank"
          }
          icon="🏆"
          variant="accent"
        />
      </section>

      {/* 7-day Summary Chart */}
      <section className="chart-section">
        <ClicksChart
          data={summary?.clicksByDay || []}
          title="System Overview: Clicks Over Last 7 Days"
          color="#2563eb"
        />
      </section>

      {/* Per-Link Analytics Panel (Modal or Collapsible Section) */}
      {selectedUrl && (
        <section className="per-link-section card">
          <div className="per-link-header">
            <div>
              <span className="badge-primary">Per-Link Analytics</span>
              <h2 className="per-link-title">
                Stats for <code>/{selectedUrl.shortCode}</code>
              </h2>
              <a
                href={selectedUrl.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="per-link-target"
              >
                Target: {selectedUrl.originalUrl}
              </a>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-close"
              onClick={() => {
                setSelectedUrl(null);
                setLinkAnalytics(null);
              }}
              aria-label="Close link analytics"
            >
              ✕ Close
            </button>
          </div>

          {loadingAnalytics ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Fetching 30-day analytics...</p>
            </div>
          ) : analyticsError ? (
            <div className="alert alert-error">{analyticsError}</div>
          ) : linkAnalytics ? (
            <div className="per-link-body">
              <div className="per-link-chart-wrapper">
                <ClicksChart
                  data={linkAnalytics.clicksByDay || []}
                  title="Link Activity: Past 30 Days"
                  color="#10b981"
                />
              </div>

              <div className="referrers-panel card">
                <h3 className="referrers-title">Top Referrers (Top 5)</h3>
                {!linkAnalytics.topReferrers || linkAnalytics.topReferrers.length === 0 ? (
                  <p className="no-referrers">No referrer records found for this link.</p>
                ) : (
                  <ul className="referrers-list">
                    {linkAnalytics.topReferrers.map((ref, idx) => (
                      <li key={idx} className="referrer-item">
                        <span className="referrer-name" title={ref.referrer}>
                          {ref.referrer === "Direct" ? "Direct / None" : ref.referrer}
                        </span>
                        <span className="referrer-count">{ref.clicks} clicks</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </section>
      )}

      {/* URL List Table */}
      <section className="table-section">
        <UrlList
          urls={urls}
          onDeleteUrl={handleDeleteUrl}
          onSelectUrl={handleSelectUrl}
          selectedUrlId={selectedUrl?._id}
          loading={loading}
        />
      </section>
    </div>
  );
}
