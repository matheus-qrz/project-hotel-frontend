// src/lib/auth-options.ts
import { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_API_URL || "").replace(/\/+$/, "");
const LOGIN_PATH = process.env.BACKEND_LOGIN_PATH || "/api/auth/login"; // ajuste se precisar

function pickToken(d: any) {
  return d?.token ?? d?.access_token ?? d?.jwt ?? d?.data?.token ?? null;
}
function pickUser(d: any) {
  return d?.user ?? d?.data?.user ?? (d?.data && (d.data.user || d.data)) ?? null;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(cred) {
        if (!cred?.email || !cred?.password) return null;

        const url = `${BACKEND}${LOGIN_PATH}`;
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              accept: "application/json",
            },
            cache: "no-store",
            body: JSON.stringify({ email: cred.email, password: cred.password }),
          });

          let data: any = null;
          try { data = await res.json(); } catch {}

          console.log("AUTH LOGIN", { url, status: res.status, env: process.env.VERCEL_ENV });

          if (!res.ok) return null;

          const user = pickUser(data);
          const token = pickToken(data);
          if (!user || !token) {
            console.warn("AUTH LOGIN: resposta sem user/token", data);
            return null;
          }

          return {
            id: String(user.id ?? user._id ?? user.userId ?? user.uid ?? ""),
            name: user.name ?? user.fullName ?? user.usuario ?? user.email ?? "Usuário",
            email: user.email ?? cred.email,
            role: user.role ?? user.perfil,
            restaurantId: user.restaurantId ?? user.restaurant?.id,
            restaurantName: user.restaurantName ?? user.restaurant?.name,
            token,
          } as any;
        } catch (err) {
          console.error("AUTH FETCH FAILED", err);
          throw new Error("AUTH_BACKEND_UNREACHABLE");
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      const allow = (process.env.ALLOWLIST_EMAILS || "")
        .split(",")
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
      if (allow.length === 0) return true;
      const email = (user?.email || "").toLowerCase();
      return allow.includes(email);
    },

    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).token;
        token.role = (user as any).role;
        token.restaurantId = (user as any).restaurantId;
        token.restaurantName = (user as any).restaurantName;
      }
      return token;
    },

    async session({ session, token }) {
      (session as any).token = token.accessToken;
      (session as any).role = token.role;

      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).restaurantId = token.restaurantId;
        (session.user as any).restaurantName = token.restaurantName;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/api/auth/error",
  },

  debug: process.env.NEXTAUTH_DEBUG === "true",
};
