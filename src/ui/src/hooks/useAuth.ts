import { useState } from "react";
import api from "../services/api";

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: LoginCredentials): Promise<AuthResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<AuthResponse>("/auth/login", credentials);
      localStorage.setItem("token", response.data.token);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loginWithApple = async (): Promise<AuthResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<AuthResponse>("/auth/apple");
      localStorage.setItem("token", response.data.token);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Apple login failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loginWithPasskey = async (): Promise<AuthResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<AuthResponse>("/auth/passkey");
      localStorage.setItem("token", response.data.token);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Passkey login failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
  };

  return {
    login,
    loginWithApple,
    loginWithPasskey,
    logout,
    loading,
    error,
  };
}
