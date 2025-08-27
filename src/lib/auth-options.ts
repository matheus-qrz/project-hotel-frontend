// /lib/auth-options.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { generateRestaurantSlug } from "@/utils/slugify";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
        if (!API_URL) throw new Error("BACKEND_API_URL não configurada");

        const res = await fetch(`${API_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: credentials?.email, password: credentials?.password }),
        });
        if (!res.ok) return null;
        const data = await res.json();

        // backend já envia restaurantInfo (id, name, unitId)
        const info = data.restaurantInfo ?? null; // :contentReference[oaicite:3]{index=3}
        const slug = info ? generateRestaurantSlug(info.restaurantName, info.restaurantId) : null;

        return {
          id: data.user.id,
          name: data.user.firstName,
          email: data.user.email,
          role: data.user.role,
          accessToken: data.token,
          restaurantInfo: info,
          restaurantSlug: slug,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role ?? null;
        token.accessToken = (user as any).accessToken ?? null;
        token.restaurantInfo = (user as any).restaurantInfo ?? null;
        token.restaurantSlug = (user as any).restaurantSlug ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken ?? null;
      (session.user as any).restaurantInfo = token.restaurantInfo ?? null;
      (session.user as any).restaurantSlug = token.restaurantSlug ?? null;
      session.user.role = (token.role as any) ?? null;
      return session;
    },
  },
  pages: { signIn: "/login" },
  debug: process.env.NODE_ENV !== "production",
};
