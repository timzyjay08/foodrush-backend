import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "./jwt";
import type { Role } from "@/db/schema";

export const AUTH_COOKIE = "fd_token";

export interface SessionUser {
  id: number;
  role: Role;
  email: string | null;
}

/**
 * Read and verify the session from the auth cookie (server side).
 * Returns null when there is no valid session.
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = await verifyToken(token);
    const id = Number(payload.sub);
    if (!Number.isInteger(id) || id <= 0) return null;
    return {
      id,
      role: (payload.role as Role) ?? "customer",
      email: (payload.email as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Guard a dashboard server component: require a specific role, otherwise
 * redirect the user to the right place (login if anonymous, their own
 * dashboard if the role is wrong).
 */
export async function requireDashboardRole(required: Role): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== required) {
    redirect(`/dashboard/${session.role}`);
  }
  return session;
}
