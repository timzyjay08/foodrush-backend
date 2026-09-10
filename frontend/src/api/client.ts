import axios from "axios";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string | null;
  code?: string | null;
};

/**
 * Single Axios instance for the FoodRush frontend.
 * Points at the existing Spring Boot REST API. Never hardcode URLs elsewhere.
 */
export const API_URL =
  (import.meta.env["VITE_API_URL"] as string | undefined) ?? "http://localhost:8080/api";

export const TOKEN_KEY = "foodrush.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

api.interceptors.response.use((response) => {
  const body = response.data as ApiEnvelope<unknown> | unknown;
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    return { ...response, data: (body as ApiEnvelope<unknown>).data };
  }
  return response;
});

// Attach the JWT to every authenticated request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Drop an expired/invalid session so the UI can send the user back to /login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearToken();
    }
    return Promise.reject(error);
  },
);
