import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, name: user.name ?? undefined, email: user.email , role: (user as any).role, clientId: (user as any).clientId };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) { if (user) (token as any).role = (user as any).role;
      if (user) token.id = user.id;
      if (user) (token as any).clientId = (user as any).clientId;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id) {
          const freshUser = await prisma.user.findUnique({ where: { id: token.id as string }, select: { role: true, clientId: true } });
          (session.user as any).role = freshUser ? freshUser.role : (token as any).role;
          (session.user as any).clientId = freshUser ? freshUser.clientId : (token as any).clientId;
          session.user.id = token.id as string;
        } else {
          (session.user as any).role = (token as any).role;
          (session.user as any).clientId = (token as any).clientId;
        }
      }
      return session;
    },
  },
};
