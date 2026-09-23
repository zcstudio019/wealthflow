import type { IncomingMessage } from "node:http";
import { config } from "../config/env.js";

export type AuthenticatedUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

function header(request: IncomingMessage, name: string) {
  const value = request.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function hasCookie(request: IncomingMessage, name: string, expectedValue: string) {
  return (header(request, "cookie") ?? "").split(";").some((part) => {
    const [key, ...value] = part.trim().split("=");
    return key === name && value.join("=") === expectedValue;
  });
}

export function getAuthenticatedUser(request: IncomingMessage): AuthenticatedUser | null {
  const userId = header(request, "oai-authenticated-user-id");
  const email = header(request, "oai-authenticated-user-email");
  if (userId && email) {
    const encodedName = header(request, "oai-authenticated-user-full-name");
    let fullName: string | null = null;
    if (encodedName && header(request, "oai-authenticated-user-full-name-encoding") === "percent-encoded-utf-8") {
      try { fullName = decodeURIComponent(encodedName); } catch { fullName = null; }
    }
    return { userId, email, fullName, displayName: fullName ?? email.split("@")[0] };
  }
  if (config.isProduction || hasCookie(request, "wealthflow_dev_signed_out", "1")) return null;
  return { ...config.devUser, fullName: config.devUser.displayName };
}