import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Local dev: DATABASE_URL="file:./dev.db" — no network needed, same local
// SQLite file as before, no auth token required for file: URLs.
// Production (Vercel): DATABASE_URL="libsql://<db>-<org>.turso.io" +
// TURSO_AUTH_TOKEN — Vercel's serverless functions have no writable
// persistent disk of their own, so the database has to live somewhere
// reachable over the network. Turso is libSQL (SQLite-compatible), so the
// schema/queries didn't need to change, just the connection.
const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaLibSql({
  url: dbUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// WAL only means anything for a local SQLite file we hold the lock on —
// Turso's own server manages storage/concurrency on the remote end, so this
// only runs for local dev (DATABASE_URL="file:...").  Without it, SQLite's
// default rollback-journal mode locks the whole file for the duration of any
// write, blocking every concurrent read.
if (dbUrl.startsWith("file:")) {
  prisma.$executeRawUnsafe("PRAGMA journal_mode = WAL;").catch(() => {});
}
