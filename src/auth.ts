import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { prisma } from "@/lib/db";

// Deliberately no database adapter — Staff auth already owns the Session
// model for a different purpose (cop_session cookie, see src/lib/auth.ts).
// Auth.js runs in pure JWT mode instead; the signIn callback below is the
// only place customer accounts get persisted, into our own Customer table.
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google, Facebook],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/dang-nhap",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      await prisma.customer.upsert({
        where: { email: user.email },
        update: {
          name: user.name ?? undefined,
          avatarUrl: user.image ?? undefined,
        },
        create: {
          email: user.email,
          name: user.name,
          avatarUrl: user.image,
          provider: account?.provider ?? "unknown",
        },
      });

      return true;
    },
  },
});
