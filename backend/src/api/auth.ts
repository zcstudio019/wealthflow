import type { IncomingMessage, ServerResponse } from "node:http";
import { clearSessionCookie, getAuthenticatedUser, setSessionCookie } from "../middleware/auth.js";
import { AuthValidationError, EmailAlreadyRegisteredError, InvalidCredentialsError, loginUser, registerUser, toPublicUser } from "../services/auth.js";
import { readJson, sendJson } from "./utils.js";

export async function authApi(request: IncomingMessage, response: ServerResponse, pathname: string) {
  try {
    if (pathname === "/api/auth/register" && request.method === "POST") {
      const user = await registerUser(await readJson(request));
      const publicUser = toPublicUser(user);
      await setSessionCookie(response, { userId: user.id, email: user.email, displayName: user.displayName });
      return sendJson(response, 201, { authenticated: true, user: publicUser });
    }
    if (pathname === "/api/auth/login" && request.method === "POST") {
      const user = await loginUser(await readJson(request));
      const publicUser = toPublicUser(user);
      await setSessionCookie(response, { userId: user.id, email: user.email, displayName: user.displayName });
      return sendJson(response, 200, { authenticated: true, user: publicUser });
    }
    if (pathname === "/api/auth/logout" && request.method === "POST") {
      clearSessionCookie(response);
      return sendJson(response, 200, { authenticated: false, user: null });
    }
    if (pathname === "/api/auth/me" && request.method === "GET") {
      const user = await getAuthenticatedUser(request);
      return user
        ? sendJson(response, 200, { authenticated: true, user: { id: user.userId, email: user.email, displayName: user.displayName } })
        : sendJson(response, 401, { authenticated: false, error: "请先登录" });
    }
    response.setHeader("Allow", pathname === "/api/auth/me" ? "GET" : "POST");
    return sendJson(response, 405, { error: "Method Not Allowed" });
  } catch (error) {
    if (error instanceof EmailAlreadyRegisteredError) return sendJson(response, 409, { error: error.message });
    if (error instanceof InvalidCredentialsError) return sendJson(response, 401, { error: "邮箱或密码错误" });
    if (error instanceof AuthValidationError) return sendJson(response, 400, { error: error.message });
    if (error instanceof Error && (error.message === "JSON 格式不正确" || error.message === "请求数据过大")) {
      return sendJson(response, 400, { error: error.message });
    }
    console.error("Authentication operation failed.");
    return sendJson(response, 500, { error: "认证服务暂时不可用" });
  }
}
