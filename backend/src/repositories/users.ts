import { eq } from "drizzle-orm";
import { users } from "../../db/schema.js";
import { db } from "../config/database.js";

export type NewUser = typeof users.$inferInsert;
export type UserRow = typeof users.$inferSelect;

export async function findUserByEmail(email: string) {
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return rows[0] ?? null;
}

export async function createUser(values: NewUser) {
  await db.insert(users).values(values);
  const created = await findUserByEmail(values.email);
  if (!created) throw new Error("User was not found after creation.");
  return created;
}

export async function updateLastLogin(userId: string, loggedInAt: Date) {
  await db.update(users).set({ lastLoginAt: loggedInAt, updatedAt: loggedInAt }).where(eq(users.id, userId));
}
