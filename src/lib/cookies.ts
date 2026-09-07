import { AUTH_COOKIE } from "./server-auth";

const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days (matches JWT expiry)

/** Serialize a Set-Cookie value for the auth token. */
export function authCookie(token: string): string {
  return `${AUTH_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}`;
}

/** Serialize a Set-Cookie value that clears the auth token. */
export function clearAuthCookie(): string {
  return `${AUTH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
