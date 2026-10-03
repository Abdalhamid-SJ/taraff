import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { CUSTOMER_ROLE } from "@/lib/auth-roles";
import { normalizeSaudiPhone, SAUDI_PHONE_REGEX } from "@/lib/phone";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "credentials", // staff — email + password (unchanged)
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email : undefined;
        const password =
          typeof credentials?.password === "string" ? credentials.password : undefined;
        if (!email || !password) return null;

        const user = await prisma.adminUser.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
    // Customers — phone + password. Same JWT session as staff, but a different
    // role, so it can never open the admin dashboard (see lib/auth-roles.ts).
    Credentials({
      id: "customer",
      name: "Customer",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const phone =
          typeof credentials?.phone === "string" ? normalizeSaudiPhone(credentials.phone) : undefined;
        const password =
          typeof credentials?.password === "string" ? credentials.password : undefined;
        if (!phone || !password || !SAUDI_PHONE_REGEX.test(phone)) return null;

        const customer = await prisma.customer.findUnique({ where: { phone } });
        if (!customer) return null;

        const valid = await bcrypt.compare(password, customer.passwordHash);
        if (!valid) return null;

        return { id: customer.id, name: customer.name, role: CUSTOMER_ROLE };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
