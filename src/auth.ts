import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { prisma } from "@/lib/db";

// Deliberately no database adapter — Staff auth already owns the Session
// model for a different purpose (cop_session cookie, see src/lib/auth.ts).
// Auth.js runs in pure JWT mode instead; the signIn callback below is the
// only place customer accounts get persisted, into our own Customer table.
//
// Only include a provider once its env vars actually exist — NextAuth treats
// a provider with missing clientId/clientSecret as a global configuration
// error, which breaks every provider's sign-in (not just the unconfigured
// one), e.g. before Facebook's app was set up, Google sign-in failed too.
const providers = [
  ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? [Google] : []),
  ...(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET ? [Facebook] : []),
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
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
