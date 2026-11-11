import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-container text-center loading-container">
        <div className="spinner"></div>
        <p>Restoring session...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
