import { createClient } from "@libsql/client";
import { readdirSync, readFileSync } from "fs";
import path from "path";

// `prisma migrate deploy` only understands connection schemes the schema
// engine natively supports (file:, postgres:, mysql:...) — it has no driver
// adapter hook, unlike the Prisma Client used at runtime (src/lib/db.ts).
// A libsql:// URL is rejected outright (P1013), so migrations against Turso
// have to be applied by replaying each migration.sql file directly over the
// libSQL client instead of through the Prisma CLI.
async function main() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !url.startsWith("libsql:")) {
    throw new Error("Set DATABASE_URL to a libsql:// URL before running this script.");
  }

  const client = createClient({ url, authToken });

  // Bookkeeping table so re-running this script (e.g. after adding a new
  // migration later) only replays the ones Turso hasn't seen yet, instead of
  // re-running CREATE TABLE statements that would fail the second time.
  await client.execute(
    "CREATE TABLE IF NOT EXISTS _turso_migrations (name TEXT PRIMARY KEY, applied_at TEXT DEFAULT CURRENT_TIMESTAMP);"
  );
  const applied = new Set(
    (await client.execute("SELECT name FROM _turso_migrations;")).rows.map((r) => r.name as string)
  );

  const migrationsDir = path.join(__dirname, "migrations");
  const folders = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .filter((name) => !applied.has(name));

  if (folders.length === 0) {
    console.log("Nothing to apply — Turso is already up to date.");
    return;
  }

  for (const folder of folders) {
    const sqlPath = path.join(migrationsDir, folder, "migration.sql");
    const sql = readFileSync(sqlPath, "utf8");
    console.log(`Applying ${folder}...`);
    await client.executeMultiple(sql);
    await client.execute({ sql: "INSERT INTO _turso_migrations (name) VALUES (?);", args: [folder] });
  }

  console.log(`Done — applied ${folders.length} migration(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
