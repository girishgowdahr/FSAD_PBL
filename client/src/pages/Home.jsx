import React from "react";
import { Link } from "react-router-dom";
import UrlForm from "../components/UrlForm";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { token, user } = useAuth();

  return (
    <div className="page-container home-page">
      <section className="hero-section text-center">
        <h1 className="hero-title">Automated URL Shortener with Analytics</h1>
        <p className="hero-subtitle">
          Transform long links into fast, branded short URLs. Enjoy custom aliases, expiration dates,
          scannable QR codes, CSV exports, and privacy-first real-time analytics.
        </p>

        {!token && (
          <div className="hero-cta-banner">
            <span>✨ Want custom aliases, expiry dates & personal analytics?</span>
            <Link to="/register" className="cta-banner-link">
              Create a free account &rarr;
            </Link>
          </div>
        )}
      </section>

      <section className="form-section">
        <UrlForm />
      </section>

      {token && (
        <section className="dashboard-shortcut-section text-center">
          <div className="shortcut-card card">
            <h3>Logged in as {user?.name}</h3>
            <p>Manage all your links, inspect 30-day click charts, and export CSV reports in your dashboard.</p>
            <Link to="/dashboard" className="btn btn-primary">
              Open My Analytics Dashboard &rarr;
            </Link>
          </div>
        </section>
      )}

      <section className="features-section">
        <div className="features-grid">
          <div className="feature-item card">
            <span className="feature-icon">⚡</span>
            <h3>Instant 302 Redirection</h3>
            <p>High-performance atomic counters record hits while redirecting visitors immediately.</p>
          </div>
          <div className="feature-item card">
            <span className="feature-icon">🏷️</span>
            <h3>Custom Aliases & Expiry</h3>
            <p>Personalize your short links with memorable words and set automatic expiration dates.</p>
          </div>
          <div className="feature-item card">
            <span className="feature-icon">📱</span>
            <h3>QR Codes & CSV Export</h3>
            <p>Generate scannable QR codes and export comprehensive Excel-ready CSV reports.</p>
          </div>
          <div className="feature-item card">
            <span className="feature-icon">🌓</span>
            <h3>Dark & Light Theme</h3>
            <p>Full support for system color schemes, manual toggling, and accessible contrast.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
