// Dumps every table of the production database to one JSON file (run by
// .github/workflows/backup.yml, which encrypts it before storing it).
// Restore: decrypt, then re-insert rows table by table with the same
// libSQL client — the file keeps each table's CREATE statement too.
//
// Usage: DATABASE_URL=libsql://… TURSO_AUTH_TOKEN=… node scripts/backup-db.mjs out.json
import { writeFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const out = process.argv[2] || "backup.json";
const db = createClient({ url: process.env.DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });

const tables = (
  await db.execute("SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
).rows;

const dump = { createdAt: new Date().toISOString(), tables: {} };
for (const { name, sql } of tables) {
  const rows = (await db.execute(`SELECT * FROM "${name}"`)).rows;
  dump.tables[name] = { sql, rows };
  console.log(`${name}: ${rows.length}`);
}
writeFileSync(out, JSON.stringify(dump, (_k, v) => (typeof v === "bigint" ? v.toString() : v)));
