import type { RowDataPacket } from "mysql2/promise";
import { closeDatabase, pool } from "../config/database.js";

interface DatabaseInfo extends RowDataPacket {
  version: string;
  characterSet: string;
}

try {
  const [rows] = await pool.query<DatabaseInfo[]>(
    "SELECT VERSION() AS version, @@character_set_connection AS characterSet",
  );
  const result = rows[0];
  if (!result) throw new Error("Database did not return version information.");
  console.log(JSON.stringify({
    database: "ok",
    engine: "mysql",
    version: result.version,
    characterSet: result.characterSet,
  }));
  if (!result.version.startsWith("8.")) throw new Error("MySQL 8.0 is required.");
  if (result.characterSet.toLowerCase() !== "utf8mb4") throw new Error("The MySQL connection must use utf8mb4.");
} finally {
  await closeDatabase();
}