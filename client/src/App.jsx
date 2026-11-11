import React from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <div className="app-layout">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <footer className="app-footer">
              <div className="footer-container">
                <p>
                  <strong>Automated URL Shortener with Analytics V2</strong> &bull; MCA Semester III &bull; Project-Based Learning (PBL)
                </p>
                <p className="footer-sub">
                  Full Stack MERN: React 18, Node.js, Express, MongoDB, JWT Authentication, Custom Aliases, Expiry & QR Codes.
                </p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
