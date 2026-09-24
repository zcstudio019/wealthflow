import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const initialSql = readFileSync(resolve(process.cwd(), "drizzle/mysql/0000_kind_polaris.sql"), "utf8");
const usersSql = readFileSync(resolve(process.cwd(), "drizzle/mysql/0001_cooing_impossible_man.sql"), "utf8");
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
  if (!initialSql.includes(fragment)) throw new Error(`Initial migration is missing: ${fragment}`);
}
for (const fragment of ["CREATE TABLE `users`", "`password_hash` varchar(255)", "UNIQUE(`email`)", "ENGINE=InnoDB", "DEFAULT CHARSET=utf8mb4"]) {
  if (!usersSql.includes(fragment)) throw new Error(`Users migration is missing: ${fragment}`);
}
if (/\b(DROP|TRUNCATE|DELETE)\b/i.test(`${initialSql}\n${usersSql}`)) {
  throw new Error("Destructive SQL found in a MySQL migration.");
}
console.log(JSON.stringify({
  migrationStaticCheck: "ok",
  dialect: "mysql",
  charset: "utf8mb4",
  usersTable: true,
  destructiveSql: false,
}));
