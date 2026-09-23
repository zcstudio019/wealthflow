import { defineConfig } from "drizzle-kit";

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const { DB_HOST, DB_PORT = "3306", DB_NAME, DB_USER, DB_PASSWORD } = process.env;
  if (!DB_HOST || !DB_NAME || !DB_USER || DB_PASSWORD === undefined) return undefined;
  return `mysql://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
}

const url = databaseUrl();

export default defineConfig({
  out: "./drizzle/mysql",
  schema: "./db/schema.ts",
  dialect: "mysql",
  ...(url ? { dbCredentials: { url } } : {}),
});