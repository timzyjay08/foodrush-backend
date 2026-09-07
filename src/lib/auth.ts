import { db } from "@/db";
import { users, type Role, type User } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken } from "./jwt";
import { ApiError } from "./http";

/**
 * Resolve the authenticated user from the `Authorization: Bearer <token>` header,
 * or from a `?token=` query parameter (used by EventSource, which cannot set
 * custom headers). Returns `null` when there is no/invalid token (does NOT throw).
 */
export async function getAuthUser(req: Request): Promise<User | null> {
  let token: string | null = null;

  const header = req.headers.get("authorization");
  if (header && header.startsWith("Bearer ")) {
    token = header.slice(7).trim();
  }

  if (!token) {
    try {
      token = new URL(req.url).searchParams.get("token");
    } catch {
      token = null;
    }
  }

  if (!token) return null;

  try {
    const payload = await verifyToken(token);
    const id = Number(payload.sub);
    if (!Number.isInteger(id) || id <= 0) return null;

    const user = await db.query.users.findFirst({ where: eq(users.id, id) });
    // Suspended accounts are denied access even with a valid token.
    if (!user || user.isSuspended) return null;
    return user;
  } catch {
    return null;
  }
}

/** Require a valid authenticated user, otherwise throw 401. */
export async function requireAuth(req: Request): Promise<User> {
  const user = await getAuthUser(req);
  if (!user) {
    throw new ApiError(401, "Authentication required", "UNAUTHORIZED");
  }
  return user;
}

/** Ensure the user has one of the allowed roles, otherwise throw 403. */
export function requireRole(user: User, allowed: Role[]): void {
  if (!allowed.includes(user.role)) {
    throw new ApiError(
      403,
      "You do not have permission to perform this action",
      "FORBIDDEN",
    );
  }
}

/** Strip sensitive fields (password hash) before returning a user. */
export function publicUser(user: User) {
  const { passwordHash, ...rest } = user;
  void passwordHash;
  return rest;
}
