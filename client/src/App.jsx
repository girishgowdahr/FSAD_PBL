import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";

function NotFound() {
  return (
    <div className="page-container not-found-page card text-center">
      <div className="not-found-icon">🔍</div>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to="/" className="btn btn-primary">
        Back to Home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <div className="footer-container">
          <p>
            <strong>Automated URL Shortener with Analytics</strong> &bull; MCA Semester III &bull; Project-Based Learning (PBL)
          </p>
          <p className="footer-sub">
            Built with React 18, Node.js, Express, and MongoDB.
          </p>
        </div>
      </footer>
    </div>
  );
}
