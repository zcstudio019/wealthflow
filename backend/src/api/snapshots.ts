import type { IncomingMessage, ServerResponse } from "node:http";
import type { AuthenticatedUser } from "../middleware/auth.js";
import { getSnapshots, upsertSnapshot, ValidationError } from "../services/snapshots.js";
import { readJson, sendJson } from "./utils.js";

export async function snapshotsApi(request: IncomingMessage, response: ServerResponse, user: AuthenticatedUser) {
  try {
    if (request.method === "GET") return sendJson(response, 200, { snapshots: await getSnapshots(user.userId) });
    if (request.method === "POST") return sendJson(response, 200, { snapshot: await upsertSnapshot(user.userId, await readJson(request)) });
    response.setHeader("Allow", "GET, POST");
    return sendJson(response, 405, { error: "Method Not Allowed" });
  } catch (error) {
    if (error instanceof ValidationError) return sendJson(response, 400, { error: error.message });
    console.error("Snapshot database operation failed.");
    return sendJson(response, 500, { error: "数据库操作失败" });
  }
}