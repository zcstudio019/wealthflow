import { headers } from "next/headers";

export type ChatGPTUser = { userId: string; displayName: string; email: string; fullName: string | null };
const SIGN_IN_PATH = "/signin-with-chatgpt";
const SIGN_OUT_PATH = "/signout-with-chatgpt";

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const h = await headers();
  const userId = h.get("oai-authenticated-user-id");
  const email = h.get("oai-authenticated-user-email");
  if (!userId || !email) return null;
  const encoded = h.get("oai-authenticated-user-full-name");
  let fullName: string | null = null;
  if (encoded && h.get("oai-authenticated-user-full-name-encoding") === "percent-encoded-utf-8") {
    try { fullName = decodeURIComponent(encoded); } catch { fullName = null; }
  }
  return { userId, email, fullName, displayName: fullName ?? email.split("@")[0] };
}

export function chatGPTSignInPath(returnTo = "/") { return `${SIGN_IN_PATH}?return_to=${encodeURIComponent(returnTo)}`; }
export function chatGPTSignOutPath(returnTo = "/") { return `${SIGN_OUT_PATH}?return_to=${encodeURIComponent(returnTo)}`; }
