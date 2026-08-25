import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { noteerLogin } from "@/lib/app-users-store";
import { findUserByEmail } from "@/lib/auth-users";
import { hasDatabase } from "@/lib/db";
import { isAdmin } from "@/lib/is-admin";
import { isMtLid } from "@/lib/is-mt";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail" },
        password: { label: "Wachtwoord", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email || "")
          .toLowerCase()
          .trim();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        const user = await findUserByEmail(email);
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // Best-effort: mislukt dit, dan is inloggen zelf niet het probleem.
        if (hasDatabase()) {
          await noteerLogin(user.email).catch(() => {});
        }

        return { id: user.email, email: user.email, name: user.email };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
        token.isAdmin = isAdmin(user.email);
        token.isMt = isMtLid(user.email);
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.isAdmin = Boolean(token.isAdmin);
        session.user.isMt = Boolean(token.isMt);
      }
      return session;
    },
  },
});
