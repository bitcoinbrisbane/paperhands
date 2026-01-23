import axios from "axios";

// Golang api
const api2 = axios.create({
  baseURL: import.meta.env.VITE_API2_URL || "https://api2.ftx.finance",
  headers: {
    "Content-Type": "application/json",
  },
});

api2.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api2;
