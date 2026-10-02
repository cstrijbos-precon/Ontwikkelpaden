import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { noteerLogin } from "@/lib/app-users-store";
import { findUserByEmail } from "@/lib/auth-users";
import { hasDatabase } from "@/lib/db";
import { isAdmin } from "@/lib/is-admin";
import { isMtLid } from "@/lib/is-mt";
import {
  clientIp,
  isGeblokkeerd,
  LIMIETEN,
  registreerMislukking,
  wisTeller,
} from "@/lib/rate-limit";

/** Zodat het loginscherm "te veel pogingen" kan melden i.p.v. "onjuist wachtwoord". */
class TeVeelPogingen extends CredentialsSignin {
  code = "te_veel_pogingen";
}

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
      authorize: async (credentials, request) => {
        const email = String(credentials?.email || "")
          .toLowerCase()
          .trim();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        // Alleen mislukte pogingen tellen mee: wie het goede wachtwoord typt,
        // komt nooit in de buurt van de grens. Per account remt dit het raden
        // van één wachtwoord, per IP-adres het langslopen van veel accounts.
        const accountSleutel = `login:account:${email}`;
        const ipSleutel = `login:ip:${clientIp(request.headers)}`;
        const [accountStand, ipStand] = await Promise.all([
          isGeblokkeerd(accountSleutel, LIMIETEN.loginPerAccount),
          isGeblokkeerd(ipSleutel, LIMIETEN.loginPerIp),
        ]);
        if (!accountStand.toegestaan || !ipStand.toegestaan) {
          throw new TeVeelPogingen();
        }

        const mislukt = async () => {
          await Promise.all([
            registreerMislukking(accountSleutel, LIMIETEN.loginPerAccount),
            registreerMislukking(ipSleutel, LIMIETEN.loginPerIp),
          ]);
          return null;
        };

        const user = await findUserByEmail(email);
        if (!user) return mislukt();

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return mislukt();

        await wisTeller(accountSleutel);

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
