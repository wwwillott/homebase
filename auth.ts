import { PrismaAdapter } from "@auth/prisma-adapter";
import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email and Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(raw) {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email }
      });
      if (!user?.passwordHash) {
        return null;
      }

      const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!valid) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name
      };
    }
  })
];

if (process.env.BYU_OIDC_CLIENT_ID && process.env.BYU_OIDC_CLIENT_SECRET && process.env.BYU_OIDC_ISSUER) {
  providers.push({
    id: "byu",
    name: "BYU SSO",
    type: "oauth",
    issuer: process.env.BYU_OIDC_ISSUER,
    clientId: process.env.BYU_OIDC_CLIENT_ID,
    clientSecret: process.env.BYU_OIDC_CLIENT_SECRET,
    wellKnown: `${process.env.BYU_OIDC_ISSUER}/.well-known/openid-configuration`,
    authorization: {
      params: {
        scope: "openid profile email"
      }
    },
    checks: ["pkce", "state"],
    idToken: true,
    profile(profile) {
      return {
        id: String(profile.sub),
        name: (profile.name as string | undefined) ?? null,
        email: (profile.email as string | undefined) ?? null
      };
    }
  });
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  providers,
  pages: {
    signIn: "/sign-in"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = String(token.id);
      }
      return session;
    }
  }
};

export function auth() {
  return getServerSession(authOptions);
}
