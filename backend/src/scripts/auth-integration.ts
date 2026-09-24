import assert from "node:assert/strict";
import { createServer } from "node:http";

if (process.env.NODE_ENV === "production") {
  throw new Error("Authentication integration tests refuse to run with NODE_ENV=production.");
}
if (process.env.MYSQL_TEST_ALLOW_WRITE !== "1") {
  throw new Error("Refusing authentication integration test: set MYSQL_TEST_ALLOW_WRITE=1 for a disposable MySQL database.");
}
if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
  throw new Error("AUTH_SECRET with at least 32 characters is required for the authentication integration test.");
}

const [{ inArray }, schema, database, { authApi }, { snapshotsApi }, auth, { sendJson }, usersRepository] = await Promise.all([
  import("drizzle-orm"),
  import("../../db/schema.js"),
  import("../config/database.js"),
  import("../api/auth.js"),
  import("../api/snapshots.js"),
  import("../middleware/auth.js"),
  import("../api/utils.js"),
  import("../repositories/users.js"),
]);

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  if (url.pathname.startsWith("/api/auth/")) return authApi(request, response, url.pathname);
  if (url.pathname === "/api/snapshots") {
    const user = await auth.getAuthenticatedUser(request);
    if (!user) return sendJson(response, 401, { error: "请先登录" });
    return snapshotsApi(request, response, user);
  }
  return sendJson(response, 404, { error: "Not Found" });
});

await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
if (!address || typeof address === "string") throw new Error("Test server did not expose a TCP port.");
const base = `http://127.0.0.1:${address.port}`;
const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
const emailA = `auth-a-${suffix}@example.test`;
const emailB = `auth-b-${suffix}@example.test`;
const password = "Wealth123";
const createdUserIds: string[] = [];

function cookieFrom(response: Response) {
  return (response.headers.get("set-cookie") ?? "").split(";", 1)[0];
}

async function json(response: Response) {
  return await response.json() as Record<string, unknown>;
}

async function post(path: string, body: unknown, cookie = "") {
  return fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
}

try {
  const registerA = await post("/api/auth/register", { displayName: "测试用户甲", email: emailA, password });
  assert.equal(registerA.status, 201);
  const registerABody = await json(registerA);
  const userA = registerABody.user as { id: string };
  createdUserIds.push(userA.id);
  const cookieA = cookieFrom(registerA);
  assert.match(registerA.headers.get("set-cookie") ?? "", /HttpOnly/);
  assert.match(registerA.headers.get("set-cookie") ?? "", /SameSite=Lax/);
  const initialSnapshotsA = await json(await fetch(`${base}/api/snapshots`, { headers: { cookie: cookieA } }));
  assert.equal((initialSnapshotsA.snapshots as unknown[]).length, 0);

  const duplicate = await post("/api/auth/register", { displayName: "重复用户", email: emailA, password });
  assert.equal(duplicate.status, 409);
  assert.equal((await json(duplicate)).error, "该邮箱已注册");

  const wrongPassword = await post("/api/auth/login", { email: emailA, password: "Wrong123" });
  assert.equal(wrongPassword.status, 401);
  assert.equal((await json(wrongPassword)).error, "邮箱或密码错误");

  const loginA = await post("/api/auth/login", { email: emailA, password });
  assert.equal(loginA.status, 200);
  const loginCookieA = cookieFrom(loginA);
  const meA = await fetch(`${base}/api/auth/me`, { headers: { cookie: loginCookieA } });
  assert.equal(meA.status, 200);

  const storedA = await usersRepository.findUserByEmail(emailA);
  assert.ok(storedA);
  assert.notEqual(storedA.passwordHash, password);

  const values = { revenue: 1000, cost: 300, expenses: 200, companyCash: 500, personalCash: 100, familyAssets: 0, investments: 0, receivable: 0, overdue: 0, inventory: 0, fixedAssets: 0, companyDebt: 0, personalDebt: 0, incoming30: 0, outgoing30: 0, monthlyFixed: 100 };
  const saveA = await post("/api/snapshots", { month: "2099-01", data: values, user_id: "forged-user-id" }, loginCookieA);
  assert.equal(saveA.status, 200);

  const registerB = await post("/api/auth/register", { displayName: "测试用户乙", email: emailB, password });
  assert.equal(registerB.status, 201);
  const registerBBody = await json(registerB);
  const userB = registerBBody.user as { id: string };
  createdUserIds.push(userB.id);
  const cookieB = cookieFrom(registerB);

  const snapshotsA = await json(await fetch(`${base}/api/snapshots`, { headers: { cookie: loginCookieA } }));
  const snapshotsB = await json(await fetch(`${base}/api/snapshots`, { headers: { cookie: cookieB } }));
  assert.equal((snapshotsA.snapshots as unknown[]).length, 1);
  assert.equal((snapshotsB.snapshots as unknown[]).length, 0);

  const reloginA = await post("/api/auth/login", { email: emailA, password });
  assert.equal(reloginA.status, 200);
  const reloginCookieA = cookieFrom(reloginA);
  const snapshotsAfterReloginA = await json(await fetch(`${base}/api/snapshots`, { headers: { cookie: reloginCookieA } }));
  assert.equal((snapshotsAfterReloginA.snapshots as unknown[]).length, 1);

  const logoutA = await post("/api/auth/logout", {}, loginCookieA);
  assert.equal(logoutA.status, 200);
  const clearedCookie = cookieFrom(logoutA);
  const meAfterLogout = await fetch(`${base}/api/auth/me`, { headers: { cookie: clearedCookie } });
  assert.equal(meAfterLogout.status, 401);

  console.log(JSON.stringify({
    registration: "ok",
    duplicateRegistration: 409,
    login: "ok",
    wrongPassword: 401,
    cookieSession: "ok",
    logout: "ok",
    newUserInitiallyEmpty: true,
    userIsolation: "ok",
    reloginPersistence: "ok",
    plaintextPasswordStored: false,
  }));
} finally {
  if (createdUserIds.length) {
    await database.db.delete(schema.financialSnapshots).where(inArray(schema.financialSnapshots.userId, createdUserIds));
    await database.db.delete(schema.users).where(inArray(schema.users.id, createdUserIds));
  } else {
    await database.db.delete(schema.users).where(inArray(schema.users.email, [emailA, emailB]));
  }
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  await database.closeDatabase();
}
