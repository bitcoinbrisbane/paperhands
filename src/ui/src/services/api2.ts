import axios from "axios";

const api2 = axios.create({
  baseURL: "/api2",
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
