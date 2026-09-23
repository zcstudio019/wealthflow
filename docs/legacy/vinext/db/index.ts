import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) throw new Error("数据库暂时不可用");
  return drizzle(env.DB, { schema });
}
