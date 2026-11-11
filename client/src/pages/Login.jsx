import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../services/api";

export default function Login() {
  const { login, token } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [token, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please fill in both email and password");
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page-container">
      <div className="auth-card card">
        <div className="auth-header text-center">
          <span className="auth-icon">🔐</span>
          <h1 className="auth-title">Log in to Shortify</h1>
          <p className="auth-subtitle">Access your personal links, analytics, and exports</p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-field">
            <label htmlFor="login-email" className="form-label">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              className="form-control"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              required
              autoFocus
            />
          </div>

          <div className="form-field">
            <label htmlFor="login-password" className="form-label">
              Password
            </label>
            <div className="password-input-wrapper">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                required
              />
              <button
                type="button"
                className="btn-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-auth-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-wrapper">
                <span className="spinner"></span> Logging in...
              </span>
            ) : (
              "Log In"
            )}
          </button>
        </form>

        <div className="auth-footer text-center">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="auth-switch-link">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
