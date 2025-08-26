// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_API_URL!;
const LOGIN_PATH = process.env.BACKEND_LOGIN_PATH || "/auth/login"; // ajuste se seu backend usa outro path

function pickToken(d: any) {
  return d?.token ?? d?.access_token ?? d?.jwt ?? d?.data?.token ?? null;
}
function pickUser(d: any) {
  return d?.user ?? d?.data?.user ?? (d?.data && (d.data.user || d.data)) ?? null;
}

const handler = NextAuth({
  // importante em Previews; dispensa NEXTAUTH_URL no Preview
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

        try {
          const url = `${BACKEND.replace(/\/+$/, "")}${LOGIN_PATH}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // server→server: CORS do navegador não se aplica
            body: JSON.stringify({ email: cred.email, password: cred.password }),
          });

          let data: any = null;
          try { data = await res.json(); } catch { /* sem corpo */ }

          console.log("AUTH LOGIN", { url, status: res.status, preview: process.env.VERCEL_ENV });

          if (!res.ok) {
            // 400/401/etc → NextAuth retorna CredentialsSignin (401)
            return null;
          }

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
            role: user.role ?? user.perfil ?? undefined,
            token, // passamos pro callback JWT
          } as any;
        } catch (err) {
          console.error("AUTH FETCH FAILED", err);
          // enviar um erro explícito leva o usuário para /auth/error?error=...
          throw new Error("AUTH_BACKEND_UNREACHABLE");
        }
      },
    }),
  ],

  callbacks: {
    // beta fechado opcional: defina ALLOWLIST_EMAILS="a@x.com,b@y.com"
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
      }
      return token;
    },

    async session({ session, token }) {
      (session as any).token = token.accessToken;
      (session as any).role = token.role;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/auth/error", // mantenha sua página de erro fora de /api
  },

  debug: process.env.NEXTAUTH_DEBUG === "true",
});

// ⚠️ Não exporte runtime='edge'; mantenha Node
export { handler as GET, handler as POST };
