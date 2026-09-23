import { eq } from "drizzle-orm";
import { financialSnapshots } from "../../db/schema.js";
import { closeDatabase, db } from "../config/database.js";
import { getSnapshots, upsertSnapshot } from "../services/snapshots.js";

if (process.env.NODE_ENV === "production") {
  throw new Error("Integration tests refuse to run with NODE_ENV=production.");
}
if (process.env.MYSQL_TEST_ALLOW_WRITE !== "1") {
  throw new Error("Set MYSQL_TEST_ALLOW_WRITE=1 only for an empty disposable MySQL 8 test database.");
}

const userId = `mysql-integration-${crypto.randomUUID()}`;
const values = [0.01, 0.10, 1_000_000.01, 999_999_999.99] as const;

try {
  for (let index = 0; index < values.length; index += 1) {
    const amount = values[index];
    const month = `2099-0${index + 1}`;
    const snapshot = await upsertSnapshot(userId, { month, data: { revenue: amount } });
    if (snapshot.data.revenue !== amount) throw new Error(`Precision mismatch for ${amount}`);
  }

  const repeated = await upsertSnapshot(userId, {
    month: "2099-01",
    data: { revenue: 0.1 + 0.2 },
  });
  if (repeated.data.revenue !== 0.3) throw new Error("0.1 + 0.2 was not normalized to 0.30.");

  const rows = await getSnapshots(userId);
  if (rows.length !== values.length) throw new Error("Duplicate month did not update the existing snapshot.");

  console.log(JSON.stringify({
    integration: "ok",
    insert: "ok",
    select: "ok",
    duplicateUpdate: "ok",
    financialPrecision: ["0.01", "0.10", "1000000.01", "999999999.99", "0.30"],
  }));
} finally {
  await db.delete(financialSnapshots).where(eq(financialSnapshots.userId, userId));
  await closeDatabase();
}