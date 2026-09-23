import { drizzle } from "drizzle-orm/sqlite-proxy";
import { mkdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { dirname, resolve } from "node:path";
import * as schema from "../../db/schema.js";
import { config } from "./env.js";

function sqlitePath(databaseUrl: string) {
  if (!databaseUrl.startsWith("file:")) throw new Error("当前阶段 DATABASE_URL 必须使用 file: SQLite URL");
  return resolve(process.cwd(), databaseUrl.slice("file:".length));
}

const path = sqlitePath(config.databaseUrl);
mkdirSync(dirname(path), { recursive: true });
const client = new DatabaseSync(path);
client.exec("PRAGMA journal_mode = WAL");
client.exec("PRAGMA foreign_keys = ON");

const migration = readFileSync(resolve(process.cwd(), "drizzle", "0000_financial_snapshots.sql"), "utf8")
  .replaceAll("--> statement-breakpoint", "");
client.exec(migration);

export const db = drizzle(async (sql, params, method) => {
  const statement = client.prepare(sql);
  if (method === "run") {
    statement.run(...params);
    return { rows: [] };
  }
  statement.setReturnArrays(true);
  if (method === "get") {
    return { rows: (statement.get(...params) as unknown[] | undefined) ?? [] };
  }
  return { rows: statement.all(...params) as unknown as unknown[][] };
}, { schema });