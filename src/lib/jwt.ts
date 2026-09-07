import { SignJWT, jwtVerify } from "jose";

const issuer = "food-delivery-api";

function secretKey() {
  const configuredSecret = process.env.JWT_SECRET;
  if (!configuredSecret || configuredSecret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long");
  }
  return new TextEncoder().encode(configuredSecret);
}

export async function signToken(
  sub: string,
  extra: Record<string, unknown> = {},
): Promise<string> {
  return new SignJWT(extra)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey(), { issuer });
  return payload;
}
