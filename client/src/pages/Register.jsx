import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../services/api";

export default function Register() {
  const { register, token } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
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

  function validate() {
    if (!name.trim()) return "Name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "Please enter a valid email address";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return "Password must contain at least one letter and one number";
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const valError = validate();
    if (valError) {
      setError(valError);
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      toast.success("Account created successfully!");
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
          <span className="auth-icon">🚀</span>
          <h1 className="auth-title">Create your Account</h1>
          <p className="auth-subtitle">Get custom aliases, expiration controls, and analytics</p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-field">
            <label htmlFor="reg-name" className="form-label">
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              className="form-control"
              placeholder="e.g. Asha Rao"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              required
              autoFocus
            />
          </div>

          <div className="form-field">
            <label htmlFor="reg-email" className="form-label">
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              className="form-control"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="reg-password" className="form-label">
              Password
            </label>
            <div className="password-input-wrapper">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="At least 8 chars with letter & number"
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
            <small className="form-hint">
              Rules: 8-72 characters, must include at least 1 letter and 1 number.
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-auth-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-wrapper">
                <span className="spinner"></span> Creating Account...
              </span>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="auth-footer text-center">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="auth-switch-link">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
