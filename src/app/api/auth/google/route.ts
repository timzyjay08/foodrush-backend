import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signToken } from "@/lib/jwt";
import { verifyGoogleIdToken } from "@/lib/google";
import { ok, fail, ApiError } from "@/lib/http";
import { authCookie } from "@/lib/cookies";

export const dynamic = "force-dynamic";

/**
 * Google Sign-In: accept an ID token issued by Google, verify it server-side,
 * and return our own JWT. Never trusts the browser for identity.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const credential = body?.credential as string | undefined;

    if (!credential) {
      throw new ApiError(400, "Missing Google credential", "MISSING_CREDENTIAL");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new ApiError(500, "Google Client ID is not configured", "GOOGLE_NOT_CONFIGURED");
    }

    let profile;
    try {
      profile = await verifyGoogleIdToken(credential, clientId);
    } catch {
      throw new ApiError(401, "Invalid Google token", "INVALID_GOOGLE_TOKEN");
    }

    if (!profile.emailVerified) {
      throw new ApiError(401, "Google email is not verified", "EMAIL_NOT_VERIFIED");
    }

    let user = await db.query.users.findFirst({
      where: eq(users.email, profile.email),
    });

    let isNewUser = false;

    if (!user) {
      // First time signing in with Google — create a customer account.
      const [created] = await db
        .insert(users)
        .values({
          name: profile.name,
          email: profile.email,
          googleId: profile.sub,
          avatarUrl: profile.picture,
          passwordHash: null,
          role: "customer",
        })
        .returning();
      user = created;
      isNewUser = true;
    } else if (!user.googleId) {
      // Existing (password) account with the same email — link Google id.
      const [linked] = await db
        .update(users)
        .set({ googleId: profile.sub, avatarUrl: profile.picture ?? user.avatarUrl })
        .where(eq(users.id, user.id))
        .returning();
      user = linked;
    }

    if (user.isSuspended) {
      throw new ApiError(403, "Your account has been suspended. Please contact support.", "ACCOUNT_SUSPENDED");
    }

    const token = await signToken(String(user.id), { role: user.role, email: user.email });
    const { passwordHash, ...safe } = user;
    void passwordHash;

    const response = ok({ user: safe, token, isNewUser });
    response.headers.append("Set-Cookie", authCookie(token));
    return response;
  } catch (err) {
    return fail(err);
  }
}
