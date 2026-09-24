import type { IncomingMessage, ServerResponse } from "node:http";
import { jwtVerify, SignJWT } from "jose";
import { config } from "../config/env.js";

export type AuthenticatedUser = {
  userId: string;
  displayName: string;
  email: string;
};

const encoder = new TextEncoder();
const issuer = "wealthflow";
const audience = "wealthflow-web";

function signingKey() {
  if (!config.auth.secret) throw new Error("AUTH_SECRET is required for authentication.");
  return encoder.encode(config.auth.secret);
}

function cookies(request: IncomingMessage) {
  const result = new Map<string, string>();
  for (const part of (request.headers.cookie ?? "").split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (name) result.set(name, value);
  }
  return result;
}

export async function createSessionToken(user: AuthenticatedUser) {
  return new SignJWT({ email: user.email, displayName: user.displayName })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.userId)
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(`${config.auth.sessionDays}d`)
    .sign(signingKey());
}

export async function getAuthenticatedUser(request: IncomingMessage): Promise<AuthenticatedUser | null> {
  const token = cookies(request).get(config.auth.cookieName);
  if (!token || !config.auth.secret) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey(), { issuer, audience, algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.email !== "string" || typeof payload.displayName !== "string") return null;
    return { userId: payload.sub, email: payload.email, displayName: payload.displayName };
  } catch {
    return null;
  }
}

function cookieBase() {
  return `${config.auth.cookieName}=; Path=/; HttpOnly; SameSite=Lax${config.isProduction ? "; Secure" : ""}`;
}

export async function setSessionCookie(response: ServerResponse, user: AuthenticatedUser) {
  const token = await createSessionToken(user);
  const maxAge = config.auth.sessionDays * 24 * 60 * 60;
  response.setHeader("set-cookie", `${config.auth.cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${config.isProduction ? "; Secure" : ""}`);
}

export function clearSessionCookie(response: ServerResponse) {
  response.setHeader("set-cookie", `${cookieBase()}; Max-Age=0`);
}
