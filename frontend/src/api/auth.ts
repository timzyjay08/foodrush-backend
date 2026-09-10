import { api } from "./client";
import type { Role, User } from "@/data/types";

/**
 * Auth calls. Endpoint paths and payload shapes are placeholders — swap them
 * for the real Spring Boot DTOs when the backend is connected.
 */

export type LoginPayload = { email: string; password: string };
export type RegisterPayload = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role?: Role;
};
export type AuthResponse = { token: string; user: User };

type BackendUser = Omit<User, "fullName" | "role"> & { name: string; role: string };

function normalizeUser(user: BackendUser): User {
  return { ...user, fullName: user.name, role: user.role.toLowerCase() as Role };
}

export async function login(payload: LoginPayload) {
  const { data } = await api.post<{ token: string; user: BackendUser }>("/auth/login", payload);
  return { token: data.token, user: normalizeUser(data.user) } satisfies AuthResponse;
}

export async function register(payload: RegisterPayload) {
  const { data } = await api.post<{ token: string; user: BackendUser }>("/auth/register", {
    name: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    password: payload.password,
    role: payload.role,
  });
  return { token: data.token, user: normalizeUser(data.user) } satisfies AuthResponse;
}

export async function me() {
  const { data } = await api.get<BackendUser>("/auth/me");
  return normalizeUser(data);
}

export async function logout() {
  await api.post("/auth/logout");
}
