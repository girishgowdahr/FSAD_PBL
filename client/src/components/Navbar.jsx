import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate("/");
  }

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-icon">⚡</span>
          <span className="brand-text">Shortify</span>
          <span className="brand-badge">V2</span>
        </Link>

        <div className="navbar-controls-mobile">
          <ThemeToggle />
          <button
            className="navbar-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>

        <nav className={`navbar-nav ${menuOpen ? "open" : ""}`}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            Home
          </NavLink>

          {token && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </NavLink>
          )}

          <div className="navbar-auth-section">
            <div className="desktop-theme-toggle">
              <ThemeToggle />
            </div>

            {token && user ? (
              <div className="user-profile-badge">
                <span className="user-avatar" title={user.email}>
                  👤 {user.name}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-logout"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons-group">
                <Link
                  to="/login"
                  className="btn btn-secondary btn-login"
                  onClick={() => setMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary btn-register"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
