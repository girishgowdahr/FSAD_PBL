import React, { useEffect, useState, useCallback } from "react";
import AnalyticsCard from "../components/AnalyticsCard";
import ClicksChart from "../components/ClicksChart";
import UrlList from "../components/UrlList";
import SearchFilterBar from "../components/SearchFilterBar";
import Pagination from "../components/Pagination";
import ConfirmModal from "../components/ConfirmModal";
import QRModal from "../components/QRModal";
import { MetricsSkeleton, TableSkeleton } from "../components/Skeleton";
import { useToast } from "../context/ToastContext";
import {
  getSummary,
  getUrls,
  deleteUrl,
  getUrlAnalytics,
  downloadAllCsv,
  downloadUrlCsv,
  getErrorMessage,
} from "../services/api";
import { downloadBlob, extractFilename } from "../utils/download";

export default function Dashboard() {
  const toast = useToast();

  const [summary, setSummary] = useState(null);
  const [urls, setUrls] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingLinkCsv, setExportingLinkCsv] = useState(false);
  const [error, setError] = useState("");

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  // Per-link analytics panel
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [linkAnalytics, setLinkAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");

  // Modals state
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [qrCandidate, setQrCandidate] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await getSummary();
      setSummary(res.data);
    } catch (err) {
      console.error("Failed to fetch summary:", err);
    }
  }, []);

  const fetchUrls = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      setError("");

      try {
        const res = await getUrls({
          search,
          status,
          sort,
          page,
          limit: 10,
        });
        setUrls(res.data);
        setMeta(res.meta);
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, status, sort, page, toast]
  );

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);

  // Handle Per-link Analytics selection
  async function handleSelectUrl(urlObj) {
    if (selectedUrl?._id === urlObj._id) {
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
      const msg = getErrorMessage(err);
      setAnalyticsError(msg);
      toast.error(msg);
    } finally {
      setLoadingAnalytics(false);
    }
  }

  // Handle Delete Confirmation
  async function handleConfirmDelete() {
    if (!deleteCandidate) return;
    try {
      await deleteUrl(deleteCandidate._id);
      toast.success("Short link deleted successfully");

      if (selectedUrl?._id === deleteCandidate._id) {
        setSelectedUrl(null);
        setLinkAnalytics(null);
      }

      setDeleteCandidate(null);
      fetchSummary();
      fetchUrls();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  // Handle Global CSV Export
  async function handleExportAllCsv() {
    setExporting(true);
    try {
      const response = await downloadAllCsv();
      const contentDisp = response.headers["content-disposition"];
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = extractFilename(contentDisp, `links-analytics-${dateStr}.csv`);
      downloadBlob(response.data, filename);
      toast.success("CSV export downloaded!");
    } catch (err) {
      toast.error("Failed to download CSV: " + getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  // Handle Per-link CSV Export
  async function handleExportLinkCsv() {
    if (!selectedUrl) return;
    setExportingLinkCsv(true);
    try {
      const response = await downloadUrlCsv(selectedUrl._id);
      const contentDisp = response.headers["content-disposition"];
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = extractFilename(contentDisp, `${selectedUrl.shortCode}-clicks-${dateStr}.csv`);
      downloadBlob(response.data, filename);
      toast.success(`CSV for /${selectedUrl.shortCode} downloaded!`);
    } catch (err) {
      toast.error("Failed to download link CSV: " + getErrorMessage(err));
    } finally {
      setExportingLinkCsv(false);
    }
  }

  const topLink = summary?.topLinks && summary.topLinks.length > 0 ? summary.topLinks[0] : null;
  const isFiltered = Boolean(search.trim() || status !== "all");

  return (
    <div className="page-container dashboard-page">
      <div className="dashboard-header-row">
        <div>
          <h1 className="page-title">Personal Analytics Dashboard</h1>
          <p className="page-subtitle">Track your private links, activity charts, and visitor engagement</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <span>⚠️</span> {error}
          <button
            type="button"
            className="btn btn-secondary btn-sm ml-auto"
            onClick={() => fetchUrls(true)}
          >
            Retry
          </button>
        </div>
      )}

      {/* Metrics Row */}
      {loading && !summary ? (
        <MetricsSkeleton />
      ) : (
        <section className="metrics-grid">
          <AnalyticsCard
            title="Total Links"
            value={summary?.totalLinks ?? 0}
            subtitle="Short links created by you"
            icon="🔗"
            variant="primary"
          />
          <AnalyticsCard
            title="Total Clicks"
            value={summary?.totalClicks ?? 0}
            subtitle="All-time visitor redirects"
            icon="📈"
            variant="success"
          />
          <AnalyticsCard
            title="Active Links"
            value={summary?.activeLinks ?? 0}
            subtitle={`${summary?.expiredLinks ?? 0} expired`}
            icon="⏱️"
            variant="default"
          />
          <AnalyticsCard
            title="Top Link"
            value={topLink ? `${topLink.clicks} clicks` : "None yet"}
            subtitle={
              topLink
                ? `/${topLink.shortCode} • ${topLink.originalUrl.slice(0, 25)}...`
                : "Generate clicks to rank"
            }
            icon="🏆"
            variant="accent"
          />
        </section>
      )}

      {/* 7-day Summary Chart */}
      <section className="chart-section">
        <ClicksChart
          data={summary?.clicksByDay || []}
          title="Overview: Your Links' Clicks Over Last 7 Days"
          color="#2563eb"
        />
      </section>

      {/* Per-Link Analytics Panel */}
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
            <div className="per-link-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleExportLinkCsv}
                disabled={exportingLinkCsv}
              >
                {exportingLinkCsv ? "Exporting..." : "📊 Export 30d CSV"}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm btn-close"
                onClick={() => {
                  setSelectedUrl(null);
                  setLinkAnalytics(null);
                }}
                aria-label="Close stats panel"
              >
                ✕ Close
              </button>
            </div>
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

      {/* Search & Filter Toolbar */}
      <section className="toolbar-section">
        <SearchFilterBar
          search={search}
          status={status}
          sort={sort}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          onStatusChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
          onSortChange={(val) => {
            setSort(val);
            setPage(1);
          }}
          onExportCsv={handleExportAllCsv}
          onRefresh={() => {
            fetchSummary();
            fetchUrls(true);
            if (selectedUrl) handleSelectUrl(selectedUrl);
          }}
          refreshing={refreshing}
          exporting={exporting}
        />
      </section>

      {/* URL List Table */}
      <section className="table-section">
        {loading ? (
          <TableSkeleton rows={5} />
        ) : (
          <>
            <UrlList
              urls={urls}
              onDeleteUrl={(u) => setDeleteCandidate(u)}
              onSelectUrl={handleSelectUrl}
              onOpenQr={(u) => setQrCandidate(u)}
              selectedUrlId={selectedUrl?._id}
              loading={loading}
              isFiltered={isFiltered}
              onClearFilters={() => {
                setSearch("");
                setStatus("all");
                setPage(1);
              }}
            />
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </section>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteCandidate)}
        title="Delete Short Link?"
        message={`Are you sure you want to delete /${deleteCandidate?.shortCode}? This will immediately disable redirection and delete all click records.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCandidate(null)}
      />

      {/* QR Code Modal */}
      <QRModal
        isOpen={Boolean(qrCandidate)}
        onClose={() => setQrCandidate(null)}
        url={qrCandidate?.shortUrl}
        shortCode={qrCandidate?.shortCode}
      />
    </div>
  );
}
