import type { Role } from "@/db/schema";

/**
 * Pure authorization rules for the dashboard area (learner / mentor / admin).
 * Kept as a standalone, dependency-free module so it is trivial to unit test
 * and can be reused by both Next.js middleware (edge) and server components.
 */

export const DASHBOARD_ROLES: readonly Role[] = ["admin", "learner", "mentor"] as const;

/** The home path each role is redirected to after login. */
export const ROLE_HOME: Record<Role, string> = {
  admin: "/dashboard/admin",
  learner: "/dashboard/learner",
  mentor: "/dashboard/mentor",
  customer: "/browse",
  restaurant: "/browse",
  rider: "/browse",
};

export function isDashboardPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

/** Where a given role should land on the dashboard. */
export function homePathForRole(role: string | null | undefined): string {
  if (role && role in ROLE_HOME) return ROLE_HOME[role as Role];
  return "/login";
}

export interface AuthzDecision {
  allowed: boolean;
  redirectTo: string | null;
}

/**
 * Decide whether a user with `role` may access `pathname`.
 *
 * - Non-dashboard routes are always allowed.
 * - Dashboard routes require a role.
 * - Non-dashboard roles (customer/restaurant/rider) are bounced to /browse.
 * - A role may only access its own dashboard subtree.
 */
export function authorize(
  pathname: string,
  role: string | null | undefined,
): AuthzDecision {
  if (!isDashboardPath(pathname)) {
    return { allowed: true, redirectTo: null };
  }

  if (!role) {
    return { allowed: false, redirectTo: "/login" };
  }

  if (!(DASHBOARD_ROLES as readonly string[]).includes(role)) {
    return { allowed: false, redirectTo: "/browse" };
  }

  const expected = `/dashboard/${role}`;
  const matches =
    pathname === "/dashboard" || pathname === expected || pathname.startsWith(expected + "/");

  return matches ? { allowed: true, redirectTo: null } : { allowed: false, redirectTo: expected };
}
