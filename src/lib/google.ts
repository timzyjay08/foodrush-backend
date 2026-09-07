import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Google Sign-In (OAuth 2.0 / OpenID Connect) verification.
 *
 * The client receives an ID token (JWT) from Google Identity Services after the
 * user signs in. We verify that token against Google's public signing keys so
 * the browser can never forge an identity.
 */

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

const GOOGLE_ISSUERS = [
  "https://accounts.google.com",
  "accounts.google.com",
];

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
}

/**
 * Verify a Google ID token and return the normalized profile.
 * Throws if the token is invalid, expired, or not for our client id.
 */
export async function verifyGoogleIdToken(
  credential: string,
  clientId: string,
): Promise<GoogleProfile> {
  const { payload } = await jwtVerify(credential, GOOGLE_JWKS, {
    issuer: GOOGLE_ISSUERS,
    audience: clientId,
  });

  if (!payload.sub || !payload.email) {
    throw new Error("Google token missing required claims");
  }

  return {
    sub: payload.sub,
    email: (payload.email as string).toLowerCase(),
    emailVerified: payload.email_verified === true,
    name: (payload.name as string) || (payload.email as string).split("@")[0],
    picture: payload.picture as string | undefined,
  };
}
