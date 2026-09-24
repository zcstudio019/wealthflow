import { createServer } from "node:http";
import { authApi } from "./api/auth.js";
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
  if (url.pathname.startsWith("/api/auth/")) return authApi(request, response, url.pathname);
  if (url.pathname === "/api/snapshots") {
    const user = await getAuthenticatedUser(request);
    if (!user) return sendJson(response, 401, { error: "请先登录" });
    return snapshotsApi(request, response, user);
  }
  return sendJson(response, 404, { error: "Not Found" });
});

server.listen(config.port, config.host, () => {
  console.log(`WealthFlow backend listening on http://${config.host}:${config.port}`);
});
