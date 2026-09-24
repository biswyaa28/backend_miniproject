// This file creates one shared axios instance for the whole frontend.
// Every API call will use this instance, so we only set the baseURL once.

import axios from "axios";

// The backend runs at http://localhost:5001 (PORT from backend .env)
const api = axios.create({
  baseURL: "http://localhost:5001/api",
});

// Request interceptor: runs BEFORE every API request.
// It reads the JWT from localStorage and attaches it as an
// Authorization header, so the backend authMiddleware can verify us.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Simple error handling: if the backend returns an error,
// throw the backend's message so pages can display it directly.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.data && error.response.data.message) {
      return Promise.reject(new Error(error.response.data.message));
    }
    return Promise.reject(error);
  }
);

export default api;
