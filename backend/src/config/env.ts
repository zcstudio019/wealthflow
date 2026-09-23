function parseInteger(name: string, value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}.`);
  }
  return parsed;
}

function buildDatabaseUrl() {
  const explicitUrl = process.env.DATABASE_URL?.trim();
  if (explicitUrl) {
    const parsed = new URL(explicitUrl);
    if (parsed.protocol !== "mysql:") throw new Error("DATABASE_URL must use the mysql:// protocol.");
    if (!parsed.hostname || !parsed.pathname.slice(1)) throw new Error("DATABASE_URL is missing a host or database name.");
    return explicitUrl;
  }

  const required = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"] as const;
  const missing = required.filter((name) => process.env[name] === undefined || process.env[name] === "");
  if (missing.length) {
    throw new Error(`Database configuration is missing: set DATABASE_URL or ${missing.join(", ")}.`);
  }

  const host = process.env.DB_HOST!;
  const port = parseInteger("DB_PORT", process.env.DB_PORT, 3306, 1, 65535);
  const name = process.env.DB_NAME!;
  const user = encodeURIComponent(process.env.DB_USER!);
  const password = encodeURIComponent(process.env.DB_PASSWORD!);
  return `mysql://${user}:${password}@${host}:${port}/${name}`;
}

const databaseUrl = buildDatabaseUrl();

export const config = {
  host: process.env.HOST?.trim() || "127.0.0.1",
  port: parseInteger("PORT", process.env.PORT, 8000, 1, 65535),
  isProduction: process.env.NODE_ENV === "production",
  database: {
    url: databaseUrl,
    connectionLimit: parseInteger("DB_CONNECTION_LIMIT", process.env.DB_CONNECTION_LIMIT, 10, 1, 50),
    connectTimeout: parseInteger("DB_CONNECT_TIMEOUT", process.env.DB_CONNECT_TIMEOUT, 10_000, 1_000, 120_000),
  },
  devUser: {
    userId: process.env.DEV_USER_ID?.trim() || "local-development-user",
    email: process.env.DEV_USER_EMAIL?.trim() || "local@wealthflow.test",
    displayName: process.env.DEV_USER_NAME?.trim() || "本地开发用户",
  },
};