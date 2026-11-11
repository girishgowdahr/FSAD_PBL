import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UrlForm from "../components/UrlForm";
import { getUrls } from "../services/api";

export default function Home() {
  const [recentUrls, setRecentUrls] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  async function fetchRecent() {
    try {
      const response = await getUrls();
      if (response?.data) {
        setRecentUrls(response.data.slice(0, 3));
      }
    } catch {
      // Non-critical on initial home load
    }
  }

  useEffect(() => {
    fetchRecent();
  }, []);

  function handleUrlCreated() {
    fetchRecent();
  }

  async function handleCopy(urlObj) {
    try {
      await navigator.clipboard.writeText(urlObj.shortUrl);
      setCopiedId(urlObj._id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }

  return (
    <div className="page-container home-page">
      <section className="hero-section text-center">
        <h1 className="hero-title">Automated URL Shortener with Analytics</h1>
        <p className="hero-subtitle">
          Transform unwieldy web links into concise, trackable short URLs. Monitor real-time clicks,
          traffic trends, and referrer sources.
        </p>
      </section>

      <section className="form-section">
        <UrlForm onUrlCreated={handleUrlCreated} />
      </section>

      {recentUrls.length > 0 && (
        <section className="recent-section">
          <div className="recent-header">
            <h2 className="recent-title">Recent Short Links</h2>
            <Link to="/dashboard" className="view-dashboard-link">
              View Analytics Dashboard &rarr;
            </Link>
          </div>

          <div className="recent-grid">
            {recentUrls.map((item) => (
              <div key={item._id} className="recent-card card">
                <div className="recent-card-top">
                  <a
                    href={item.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="recent-shortlink"
                  >
                    {item.shortUrl}
                  </a>
                  <span className="click-pill">{item.clicks} clicks</span>
                </div>
                <div className="recent-target" title={item.originalUrl}>
                  {item.originalUrl}
                </div>
                <div className="recent-actions">
                  <button
                    type="button"
                    className={`btn-action btn-copy-sm ${copiedId === item._id ? "btn-copied" : ""}`}
                    onClick={() => handleCopy(item)}
                  >
                    {copiedId === item._id ? "✓ Copied" : "Copy"}
                  </button>
                  <a
                    href={item.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-action btn-open-sm"
                  >
                    Open
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="features-section">
        <div className="features-grid">
          <div className="feature-item card">
            <span className="feature-icon">🚀</span>
            <h3>Instant 302 Redirection</h3>
            <p>High-performance atomic counter records every single visitor hit in real-time.</p>
          </div>
          <div className="feature-item card">
            <span className="feature-icon">📊</span>
            <h3>Comprehensive Analytics</h3>
            <p>Visualize 7-day system summaries and detailed 30-day per-link traffic charts.</p>
          </div>
          <div className="feature-item card">
            <span className="feature-icon">🛡️</span>
            <h3>Privacy & Security First</h3>
            <p>Strict input validation, rate limiting, and zero storage of personal visitor IP/data.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
