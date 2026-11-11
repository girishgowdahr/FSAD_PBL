import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

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

export async function createUrl(originalUrl) {
  const response = await api.post("/urls", { originalUrl });
  return response.data;
}

export async function getUrls() {
  const response = await api.get("/urls");
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

export async function getUrlAnalytics(id) {
  const response = await api.get(`/urls/${id}/analytics`);
  return response.data;
}

export async function getSummary() {
  const response = await api.get("/analytics/summary");
  return response.data;
}

export default api;
