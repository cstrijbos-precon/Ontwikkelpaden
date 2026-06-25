import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/lib/auth-users";
import { isAdmin } from "@/lib/is-admin";

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
        const email = String(credentials?.email || "").toLowerCase().trim();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        const user = findUserByEmail(email);
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.email, email: user.email, name: user.email };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
        token.isAdmin = isAdmin(user.email);
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
});
