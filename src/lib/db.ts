import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Next.js loads `.env` automatically; DATABASE_URL is "file:./dev.db" (see .env).
const dbUrl = (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, "");
// busy_timeout: SQLite allows only one writer at a time — under concurrent
// traffic (an order being placed while another write is in flight), the
// second write waits up to 5s for the lock instead of failing immediately
// with "database is locked".
const adapter = new PrismaBetterSqlite3({ url: dbUrl, timeout: 5000 });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// WAL mode is stored in the database file itself (persists across restarts,
// not just this process), so this only needs to actually change anything
// once — but it's cheap and idempotent, so just always confirm it on boot.
// Without it, SQLite's default rollback-journal mode locks the whole file for
// the duration of any write, blocking every concurrent read (e.g. a customer
// browsing products while staff updates stock) — WAL lets reads proceed
// alongside a single in-progress write.
prisma.$executeRawUnsafe("PRAGMA journal_mode = WAL;").catch(() => {});
