import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../../db/schema.js";
import { config } from "./env.js";

export const pool = mysql.createPool({
  uri: config.database.url,
  connectionLimit: config.database.connectionLimit,
  connectTimeout: config.database.connectTimeout,
  charset: "utf8mb4",
  timezone: "Z",
  decimalNumbers: false,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export const db = drizzle(pool, { schema, mode: "default" });

export async function checkDatabaseConnection() {
  const [rows] = await pool.query("SELECT 1 AS healthy");
  return Array.isArray(rows);
}

export async function closeDatabase() {
  await pool.end();
}