import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sql = readFileSync(resolve(process.cwd(), "drizzle/mysql/0000_kind_polaris.sql"), "utf8");
const required = [
  "CREATE TABLE `financial_snapshots`",
  "`id` varchar(36)",
  "`data` json NOT NULL",
  "`created_at` datetime(3)",
  "UNIQUE(`user_id`,`month`)",
  "ENGINE=InnoDB",
  "DEFAULT CHARSET=utf8mb4",
];
for (const fragment of required) {
  if (!sql.includes(fragment)) throw new Error(`Migration is missing: ${fragment}`);
}
if (/\b(DROP|TRUNCATE|DELETE)\b/i.test(sql)) {
  throw new Error("Destructive SQL found in the initial MySQL migration.");
}
console.log(JSON.stringify({
  migrationStaticCheck: "ok",
  dialect: "mysql",
  charset: "utf8mb4",
  destructiveSql: false,
}));