import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-icon">⚡</span>
          <span className="brand-text">Shortify</span>
          <span className="brand-badge">PBL</span>
        </Link>

        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        <nav className={`navbar-nav ${menuOpen ? "open" : ""}`}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            Home
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
