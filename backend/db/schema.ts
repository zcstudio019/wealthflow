import { sql } from "drizzle-orm";
import { char, datetime, json, mysqlTable, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export type StoredFinancialData = Record<string, string>;

export const financialSnapshots = mysqlTable("financial_snapshots", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  month: char("month", { length: 7 }).notNull(),
  data: json("data").$type<StoredFinancialData>().notNull(),
  createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime("updated_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
}, (table) => [
  uniqueIndex("financial_snapshots_user_month").on(table.userId, table.month),
]);