import { and, desc, eq } from "drizzle-orm";
import type { StoredFinancialData } from "../../db/schema.js";
import { financialSnapshots } from "../../db/schema.js";
import { db } from "../config/database.js";

export async function listSnapshots(userId: string) {
  return db.select().from(financialSnapshots)
    .where(eq(financialSnapshots.userId, userId))
    .orderBy(desc(financialSnapshots.month)).limit(36);
}

export async function saveSnapshot(userId: string, month: string, data: StoredFinancialData) {
  const now = new Date();
  const values = { id: crypto.randomUUID(), userId, month, data, updatedAt: now };
  await db.insert(financialSnapshots).values(values).onDuplicateKeyUpdate({
    set: { data, updatedAt: now },
  });
  const rows = await db.select().from(financialSnapshots).where(and(
    eq(financialSnapshots.userId, userId),
    eq(financialSnapshots.month, month),
  )).limit(1);
  return rows[0];
}