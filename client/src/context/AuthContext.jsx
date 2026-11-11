import React, { createContext, useContext, useState, useEffect } from "react";
import { getMe, login as apiLogin, register as apiRegister } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("token") || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount if token exists
  useEffect(() => {
    async function initAuth() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await getMe();
        setUser(res.data.user);
      } catch {
        // Token expired or invalid
        try {
          localStorage.removeItem("token");
        } catch {
          // Ignore
        }
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, [token]);

  async function login(credentials) {
    const res = await apiLogin(credentials);
    const { token: newToken, user: newUser } = res.data;
    try {
      localStorage.setItem("token", newToken);
    } catch {
      // Ignore
    }
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }

  async function register(userData) {
    const res = await apiRegister(userData);
    const { token: newToken, user: newUser } = res.data;
    try {
      localStorage.setItem("token", newToken);
    } catch {
      // Ignore
    }
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }

  function logout() {
    try {
      localStorage.removeItem("token");
    } catch {
      // Ignore
    }
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
