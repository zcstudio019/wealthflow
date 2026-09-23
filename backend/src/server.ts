import { createServer } from "node:http";
import { snapshotsApi } from "./api/snapshots.js";
import { sendJson } from "./api/utils.js";
import { checkDatabaseConnection } from "./config/database.js";
import { config } from "./config/env.js";
import { getAuthenticatedUser } from "./middleware/auth.js";

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  if (url.pathname === "/api/health" && request.method === "GET") {
    try {
      await checkDatabaseConnection();
      return sendJson(response, 200, { status: "ok", database: "ok" });
    } catch {
      return sendJson(response, 503, { status: "degraded", database: "unavailable" });
    }
  }
  if (url.pathname === "/api/auth/logout" && request.method === "POST") {
    if (config.isProduction) return sendJson(response, 200, { redirectTo: "/signout-with-chatgpt?return_to=/" });
    response.setHeader("set-cookie", "wealthflow_dev_signed_out=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400");
    return sendJson(response, 200, { user: null });
  }
  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    if (config.isProduction) return sendJson(response, 200, { redirectTo: "/signin-with-chatgpt?return_to=/" });
    response.setHeader("set-cookie", "wealthflow_dev_signed_out=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
    return sendJson(response, 200, { user: { displayName: config.devUser.displayName, email: config.devUser.email } });
  }
  const user = getAuthenticatedUser(request);
  if (url.pathname === "/api/auth/me" && request.method === "GET") {
    return user
      ? sendJson(response, 200, { user: { displayName: user.displayName, email: user.email } })
      : sendJson(response, 401, { error: "请先登录" });
  }
  if (url.pathname === "/api/snapshots") {
    if (!user) return sendJson(response, 401, { error: "请先登录" });
    return snapshotsApi(request, response, user);
  }
  return sendJson(response, 404, { error: "Not Found" });
});

server.listen(config.port, config.host, () => {
  console.log(`WealthFlow backend listening on http://${config.host}:${config.port}`);
});