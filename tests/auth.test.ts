import "dotenv/config";
import { describe, it, expect } from "vitest";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { authorize, homePathForRole } from "@/lib/authz";

/**
 * Authentication & dashboard-authorization tests.
 *
 * The login tests are real integration tests: they call the actual
 * `POST /api/auth/login` route handler against the PostgreSQL database (seeded
 * with `customer@delivery.dev` / `Password123!`). The dashboard tests exercise
 * the pure authorization rules used by the middleware.
 */

function loginRequest(email: string, password: string): Request {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

describe("authentication", () => {
  it("successful login returns a token and the user", async () => {
    const res = await loginHandler(loginRequest("customer@delivery.dev", "Password123!"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeTruthy();
    expect(body.data.user.email).toBe("customer@delivery.dev");
    expect(body.data.user.role).toBe("customer");
    expect(body.data.user.passwordHash).toBeUndefined();
  });

  it("invalid credentials return 401 with INVALID_CREDENTIALS", async () => {
    const res = await loginHandler(loginRequest("customer@delivery.dev", "wrong-password"));
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe("INVALID_CREDENTIALS");
  });

  it("unknown email returns 401", async () => {
    const res = await loginHandler(loginRequest("nobody@delivery.dev", "Password123!"));
    expect(res.status).toBe(401);
  });

  it("missing password fails validation with 400", async () => {
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "customer@delivery.dev" }),
    });
    const res = await loginHandler(req);
    expect(res.status).toBe(400);
  });
});

describe("dashboard authorization (middleware rules)", () => {
  it("redirects unauthenticated users to /login", () => {
    expect(authorize("/dashboard/admin", null)).toEqual({
      allowed: false,
      redirectTo: "/login",
    });
  });

  it("blocks a learner from the admin dashboard", () => {
    const decision = authorize("/dashboard/admin", "learner");
    expect(decision.allowed).toBe(false);
    expect(decision.redirectTo).toBe("/dashboard/learner");
  });

  it("blocks a mentor from the learner dashboard", () => {
    const decision = authorize("/dashboard/learner", "mentor");
    expect(decision.allowed).toBe(false);
    expect(decision.redirectTo).toBe("/dashboard/mentor");
  });

  it("allows an admin to access the admin dashboard", () => {
    expect(authorize("/dashboard/admin", "admin")).toEqual({
      allowed: true,
      redirectTo: null,
    });
  });

  it("allows nested dashboard sub-routes for the matching role", () => {
    expect(authorize("/dashboard/learner/courses", "learner").allowed).toBe(true);
  });

  it("bounces non-dashboard roles away from the dashboard", () => {
    expect(authorize("/dashboard/admin", "customer")).toEqual({
      allowed: false,
      redirectTo: "/browse",
    });
  });

  it("leaves public routes accessible", () => {
    expect(authorize("/browse", null)).toEqual({ allowed: true, redirectTo: null });
    expect(authorize("/", null)).toEqual({ allowed: true, redirectTo: null });
  });

  it("maps each role to its dashboard home", () => {
    expect(homePathForRole("admin")).toBe("/dashboard/admin");
    expect(homePathForRole("learner")).toBe("/dashboard/learner");
    expect(homePathForRole("mentor")).toBe("/dashboard/mentor");
    expect(homePathForRole("customer")).toBe("/browse");
    expect(homePathForRole(null)).toBe("/login");
  });
});
