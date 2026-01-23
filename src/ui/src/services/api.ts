import axios from "axios";

// Typescript based API
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://api.ftx.finance",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
