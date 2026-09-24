import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { compare, hash } from "bcryptjs";

process.env.DATABASE_URL ||= "mysql://static:static@127.0.0.1:3306/wealthflow_static";
process.env.AUTH_SECRET ||= randomBytes(32).toString("hex");

const { createSessionToken, getAuthenticatedUser, setSessionCookie } = await import("../middleware/auth.js");

const plainPassword = "Wealth123";
const passwordHash = await hash(plainPassword, 12);
assert.notEqual(passwordHash, plainPassword);
assert.ok(passwordHash.startsWith("$2"));
assert.equal(await compare(plainPassword, passwordHash), true);
assert.equal(await compare("Wrong123", passwordHash), false);

const user = { userId: crypto.randomUUID(), email: "security@example.com", displayName: "安全测试" };
const token = await createSessionToken(user);
const request = { headers: { cookie: `wealthflow_session=${token}` } };
assert.deepEqual(await getAuthenticatedUser(request as never), user);
assert.equal(await getAuthenticatedUser({ headers: { cookie: `wealthflow_session=${token}x` } } as never), null);

let setCookie = "";
await setSessionCookie({ setHeader: (_name: string, value: string) => { setCookie = value; } } as never, user);
assert.match(setCookie, /HttpOnly/);
assert.match(setCookie, /SameSite=Lax/);
assert.equal(setCookie.includes(plainPassword), false);

const migration = await readFile(new URL("../../drizzle/mysql/0001_cooing_impossible_man.sql", import.meta.url), "utf8");
assert.match(migration, /CREATE TABLE `users`/);
assert.match(migration, /UNIQUE\(`email`\)/);
assert.match(migration, /password_hash/);
assert.doesNotMatch(migration, /DROP|TRUNCATE|DELETE/i);

const repository = await readFile(new URL("../repositories/snapshots.ts", import.meta.url), "utf8");
assert.match(repository, /eq\(financialSnapshots\.userId, userId\)/);
assert.doesNotMatch(repository, /body\.userId|body\.user_id/);

console.log(JSON.stringify({
  authStaticCheck: "ok",
  passwordHash: "bcrypt",
  jwtTamperRejected: true,
  cookie: { httpOnly: true, sameSite: "Lax" },
  usersMigrationSafe: true,
  snapshotsScopedBySessionUser: true,
}));
