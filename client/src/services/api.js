import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Attach Authorization header if token exists
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore localStorage errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 on protected requests
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register" && path !== "/") {
        try {
          localStorage.removeItem("token");
        } catch {
          // Ignore
        }
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Helper to extract clean error message
export function getErrorMessage(error) {
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return "An unexpected error occurred. Please try again.";
}

// Auth API
export async function register(data) {
  const response = await api.post("/auth/register", data);
  return response.data;
}

export async function login(data) {
  const response = await api.post("/auth/login", data);
  return response.data;
}

export async function getMe() {
  const response = await api.get("/auth/me");
  return response.data;
}

// URL API
export async function createUrl({ originalUrl, customAlias, expiresAt }) {
  const payload = { originalUrl };
  if (customAlias && customAlias.trim()) payload.customAlias = customAlias.trim();
  if (expiresAt && expiresAt.trim()) payload.expiresAt = expiresAt.trim();

  const response = await api.post("/urls", payload);
  return response.data;
}

export async function getUrls(params = {}) {
  const response = await api.get("/urls", { params });
  return response.data;
}

export async function getUrlById(id) {
  const response = await api.get(`/urls/${id}`);
  return response.data;
}

export async function deleteUrl(id) {
  const response = await api.delete(`/urls/${id}`);
  return response.data;
}

// Analytics API
export async function getUrlAnalytics(id) {
  const response = await api.get(`/urls/${id}/analytics`);
  return response.data;
}

export async function getSummary() {
  const response = await api.get("/analytics/summary");
  return response.data;
}

// CSV Downloads
export async function downloadAllCsv() {
  const response = await api.get("/analytics/export.csv", {
    responseType: "blob",
  });
  return response;
}

export async function downloadUrlCsv(id) {
  const response = await api.get(`/urls/${id}/analytics/export.csv`, {
    responseType: "blob",
  });
  return response;
}

export default api;
