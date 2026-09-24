// Makes one database an exact copy of another, row for row — used to move
// the shop's database to a new region (and, if that ever has to be undone,
// to copy everything back). Works between any two libSQL/SQLite databases:
// Turso ↔ Turso, or local files for testing.
//
//   node scripts/db-mirror.mjs <from> <to>           compare only, writes nothing
//   node scripts/db-mirror.mjs <from> <to> --apply   make <to> identical to <from>
//
// <from>/<to> are env files with DATABASE_URL (+ TURSO_AUTH_TOKEN for Turso),
// so tokens never end up on the command line, or a plain file: URL.
//
// An empty <to> gets the full schema and every row. A <to> that already has
// tables must have exactly the same schema (same migrations applied) — then
// only the differences are written: missing rows inserted, changed rows
// updated, rows that no longer exist in <from> deleted. Running it twice in
// a row is therefore cheap, and the second run doubles as the proof that
// both sides match. Nothing is ever written to <from>.
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const [fromArg, toArg] = args.filter((a) => !a.startsWith("--"));
if (!fromArg || !toArg) {
  console.error("Cách dùng: node scripts/db-mirror.mjs <nguồn> <đích> [--apply]");
  process.exit(2);
}

function connect(arg) {
  if (/^(file|libsql|https?):/.test(arg)) return { url: arg, client: createClient({ url: arg, intMode: "bigint" }) };
  const env = Object.fromEntries(
    readFileSync(arg, "utf8")
      .split(/\r?\n/)
      .filter((l) => /^[A-Z0-9_]+=/.test(l))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
      })
  );
  if (!env.DATABASE_URL) throw new Error(`${arg} không có DATABASE_URL`);
  return {
    url: env.DATABASE_URL,
    client: createClient({ url: env.DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN, intMode: "bigint" }),
  };
}

const from = connect(fromArg);
const to = connect(toArg);
if (from.url === to.url) throw new Error("Nguồn và đích là cùng một database.");
console.log(`Nguồn: ${from.url}\nĐích:  ${to.url}\n`);

const q = (name) => `"${name.replace(/"/g, '""')}"`;
const INTERNAL = /^(sqlite_|libsql_|_litestream)/;

async function schema(db) {
  const rows = (await db.execute("SELECT type, name, tbl_name, sql FROM sqlite_master WHERE sql IS NOT NULL")).rows;
  return rows.filter((r) => !INTERNAL.test(r.name) && !INTERNAL.test(r.tbl_name));
}
const norm = (sql) => sql.replace(/\s+/g, " ").replace(/"/g, "").trim();

const srcSchema = await schema(from.client);
const dstSchema = await schema(to.client);
const tables = srcSchema.filter((s) => s.type === "table").map((s) => s.name);
const fresh = dstSchema.length === 0;

if (!fresh) {
  const a = new Map(srcSchema.map((s) => [s.name, norm(s.sql)]));
  const b = new Map(dstSchema.map((s) => [s.name, norm(s.sql)]));
  const diff = [...new Set([...a.keys(), ...b.keys()])].filter((n) => a.get(n) !== b.get(n));
  if (diff.length) {
    console.error(`Cấu trúc hai database khác nhau (${diff.join(", ")}) — chạy cùng các migration cho cả hai trước.`);
    process.exit(1);
  }
}

// Parents before children, so inserts never point at a row that isn't there
// yet (deletes run in the reverse order). A table referencing itself
// (Category.parentId) is ordered row by row further down.
const meta = {};
for (const t of tables) {
  const cols = (await from.client.execute(`PRAGMA table_info(${q(t)})`)).rows;
  const fks = (await from.client.execute(`PRAGMA foreign_key_list(${q(t)})`)).rows;
  const pk = cols.filter((c) => Number(c.pk) > 0).sort((x, y) => Number(x.pk) - Number(y.pk)).map((c) => c.name);
  meta[t] = {
    cols: cols.map((c) => c.name),
    // Join tables (_ProductCategories) have no primary key — the whole row is the key.
    key: pk.length ? pk : cols.map((c) => c.name),
    hasPk: pk.length > 0,
    parents: [...new Set(fks.map((f) => f.table).filter((p) => p !== t && tables.includes(p)))],
    selfRef: fks.filter((f) => f.table === t).map((f) => ({ from: f.from, to: f.to })),
  };
}
const order = [];
const visit = (t, seen = new Set()) => {
  if (order.includes(t) || seen.has(t)) return;
  seen.add(t);
  meta[t].parents.forEach((p) => visit(p, seen));
  order.push(t);
};
tables.forEach((t) => visit(t));

const enc = (v) =>
  typeof v === "bigint" ? `${v}n` : v instanceof ArrayBuffer ? `b:${Buffer.from(v).toString("base64")}` : v;
const sig = (vals) => JSON.stringify(vals.map(enc));

async function readTable(db, t) {
  const { cols, key } = meta[t];
  const res = await db.execute(`SELECT ${cols.map(q).join(", ")} FROM ${q(t)}`);
  const keyIdx = key.map((k) => cols.indexOf(k));
  const map = new Map();
  for (const r of res.rows) {
    const vals = cols.map((_, i) => r[i]);
    map.set(sig(keyIdx.map((i) => vals[i])), vals);
  }
  return map;
}

function sortSelfRef(t, rows) {
  const ref = meta[t].selfRef[0];
  if (!ref) return rows;
  const fromI = meta[t].cols.indexOf(ref.from);
  const toI = meta[t].cols.indexOf(ref.to);
  const pending = new Map(rows.map((r) => [enc(r[toI]), r]));
  const out = [];
  while (pending.size) {
    const before = pending.size;
    for (const [id, r] of pending) {
      if (r[fromI] === null || !pending.has(enc(r[fromI]))) {
        out.push(r);
        pending.delete(id);
      }
    }
    if (pending.size === before) return [...out, ...pending.values()];
  }
  return out;
}

async function diffAll() {
  const plan = {};
  let total = 0;
  for (const t of order) {
    const src = await readTable(from.client, t);
    // A table the target doesn’t have yet (empty target) reads as no rows.
    const dst = await readTable(to.client, t).catch(() => new Map());
    const inserts = [], updates = [], deletes = [];
    for (const [k, vals] of src) {
      const cur = dst.get(k);
      if (!cur) inserts.push(vals);
      else if (sig(cur) !== sig(vals)) updates.push(vals);
    }
    for (const [k, vals] of dst) if (!src.has(k)) deletes.push(vals);
    plan[t] = { inserts: sortSelfRef(t, inserts), updates, deletes, srcRows: src.size, dstRows: dst.size };
    total += inserts.length + updates.length + deletes.length;
  }
  return { plan, total };
}

function report({ plan, total }) {
  for (const t of order) {
    const p = plan[t];
    const changes = p.inserts.length + p.updates.length + p.deletes.length;
    const mark = changes ? `  +${p.inserts.length} ~${p.updates.length} -${p.deletes.length}` : "  khớp";
    console.log(`${t.padEnd(24)} nguồn ${String(p.srcRows).padStart(6)}  đích ${String(p.dstRows).padStart(6)}${mark}`);
  }
  console.log(total ? `\n${total} dòng khác nhau.` : "\nHai database khớp hoàn toàn.");
}

const first = await diffAll();
if (fresh) console.log("Đích đang trống — sẽ tạo toàn bộ cấu trúc và chép mọi dòng.\n");
report(first);

if (!apply) {
  if (first.total || fresh) console.log("\nChưa ghi gì. Thêm --apply để đồng bộ đích theo nguồn.");
  process.exit(first.total || fresh ? 1 : 0);
}
if (!first.total && !fresh) process.exit(0);

// Statements go out in transactions of a few hundred; defer_foreign_keys
// lets a batch be checked as a whole when it commits, rather than row by
// row. Updates are upserts (not INSERT OR REPLACE), because REPLACE deletes
// the old row first and would cascade-delete its children — e.g. rewriting
// an Order would wipe its OrderItems.
const statements = [];
if (fresh) {
  for (const t of order) statements.push(srcSchema.find((s) => s.name === t).sql);
}
for (const t of [...order].reverse()) {
  const { key } = meta[t];
  const keyIdx = key.map((k) => meta[t].cols.indexOf(k));
  for (const vals of first.plan[t].deletes) {
    statements.push({
      sql: `DELETE FROM ${q(t)} WHERE ${key.map((k) => `${q(k)} IS ?`).join(" AND ")}`,
      args: keyIdx.map((i) => vals[i]),
    });
  }
}
for (const t of order) {
  const { cols, key, hasPk } = meta[t];
  const rest = cols.filter((c) => !key.includes(c));
  const upsert =
    hasPk && rest.length
      ? ` ON CONFLICT(${key.map(q).join(", ")}) DO UPDATE SET ${rest.map((c) => `${q(c)} = excluded.${q(c)}`).join(", ")}`
      : hasPk
        ? ` ON CONFLICT DO NOTHING`
        : "";
  const sql = `INSERT INTO ${q(t)} (${cols.map(q).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})${upsert}`;
  for (const vals of [...first.plan[t].inserts, ...first.plan[t].updates]) {
    statements.push({ sql, args: vals.map((v) => (v instanceof ArrayBuffer ? new Uint8Array(v) : v)) });
  }
}
if (fresh) {
  for (const s of srcSchema.filter((s) => s.type !== "table")) statements.push(s.sql);
}

const CHUNK_STATEMENTS = 200;
const CHUNK_BYTES = 2 * 1024 * 1024;
let chunk = [], bytes = 0, done = 0;
async function flush() {
  if (!chunk.length) return;
  await to.client.batch(["PRAGMA defer_foreign_keys = ON", ...chunk], "write");
  done += chunk.length;
  process.stdout.write(`\rĐã ghi ${done}/${statements.length}`);
  chunk = [];
  bytes = 0;
}
for (const s of statements) {
  const size = typeof s === "string" ? s.length : s.sql.length + JSON.stringify(s.args, (_, v) => (typeof v === "bigint" ? String(v) : v)).length;
  if (chunk.length && (chunk.length >= CHUNK_STATEMENTS || bytes + size > CHUNK_BYTES)) await flush();
  chunk.push(s);
  bytes += size;
}
await flush();
console.log("\n\nKiểm tra lại sau khi ghi:");

const fk = (await to.client.execute("PRAGMA foreign_key_check")).rows;
if (fk.length) console.error(`Cảnh báo: ${fk.length} dòng trỏ tới dòng không tồn tại (${[...new Set(fk.map((r) => r.table))].join(", ")}).`);
const second = await diffAll();
report(second);
process.exit(second.total || fk.length ? 1 : 0);
