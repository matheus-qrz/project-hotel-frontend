// src/lib/auth-options.ts
import { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_API_URL || "").replace(/\/+$/, "");
const LOGIN_PATH = "/login"; 

function pick<T = any>(o: any, ...paths: string[]): T | null {
  for (const p of paths) {
    const v = p.split(".").reduce((acc, k) => acc?.[k], o);
    if (v != null) return v as T;
  }
  return null;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: { email: { label: "Email" }, password: { label: "Senha", type: "password" } },
      async authorize(cred) {
        if (!cred?.email || !cred?.password) return null;

        const url = `${API_BASE}${LOGIN_PATH}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          cache: "no-store",
          body: JSON.stringify({ email: cred.email, password: cred.password }),
        });

        let data: any = null;
        try { data = await res.json(); } catch {}

        if (!res.ok) return null;

        const token =
          pick<string>(data, "token", "access_token", "jwt", "data.token") || null;
        const userObj =
          pick<any>(data, "user", "data.user", "data") || null;

        if (!token || !userObj) return null;

        // Tente achar o slug em várias formas comuns que o backend pode devolver
        let restaurantSlug =
          pick<string>(userObj, "restaurant.slug", "slug", "restaurantSlug") || null;

        // Se não veio no login, opcionalmente busque num endpoint com o token
        if (!restaurantSlug) {
          try {
            const r = await fetch(`${API_BASE}/restaurant/me`, {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            });
            if (r.ok) {
              const j = await r.json();
              restaurantSlug =
                pick<string>(j, "restaurant.slug", "slug", "data.restaurant.slug", "data.slug") || null;
            }
          } catch {}
        }

        return {
          id: String(userObj.id ?? userObj._id ?? userObj.userId ?? userObj.uid ?? ""),
          name: userObj.name ?? userObj.fullName ?? userObj.usuario ?? userObj.email ?? "Usuário",
          email: userObj.email ?? cred.email,
          role: userObj.role ?? userObj.perfil,
          restaurantId: userObj.restaurantId ?? userObj.restaurant?.id,
          restaurantName: userObj.restaurantName ?? userObj.restaurant?.name,
          restaurantSlug,               // <- **AQUI**
          token,                         // <- token para chamadas ao backend
        } as any;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).token;
        token.role = (user as any).role;
        token.restaurantId = (user as any).restaurantId;
        token.restaurantName = (user as any).restaurantName;
        token.restaurantSlug = (user as any).restaurantSlug;  // <- **propaga**
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).token = token.accessToken;
      (session as any).role = token.role;

      // Coloque também dentro de session.user para facilitar no cliente
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).restaurantId = token.restaurantId;
        (session.user as any).restaurantName = token.restaurantName;
        (session.user as any).restaurantSlug = token.restaurantSlug;  // <- **propaga**
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/api/auth/error",
  },
};
