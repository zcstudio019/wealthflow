import { sql } from "drizzle-orm";
import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const financialSnapshots = sqliteTable("financial_snapshots", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  month: text("month").notNull(),
  data: text("data").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("financial_snapshots_user_month").on(table.userId, table.month)]);
