import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page-container not-found-page card text-center">
      <div className="not-found-icon">🔍</div>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist or has been moved.</p>
      <Link to="/" className="btn btn-primary">
        Back to Home
      </Link>
    </div>
  );
}
