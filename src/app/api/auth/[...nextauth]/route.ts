import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const handler = NextAuth({
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
        if (!API_URL) throw new Error("API_URL ausente");

        const res = await fetch(`${API_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!res.ok) return null;
        const data = await res.json();

        if (!data?.user) return null;

        // filtre as roles que podem logar
        if (!["ADMIN", "MANAGER"].includes(data.user.role)) return null;

        return {
          id: data.user.id ?? data.user._id,
          name: data.user.firstName,
          email: data.user.email,
          role: data.user.role,
          token: data.token,
          restaurantId:
            data.restaurantInfo?.restaurantId ??
            data.user.restaurantId ??
            data.user._id,
          restaurantName: data.restaurantInfo?.restaurantName,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.restaurantId = (user as any).restaurantId;
        token.restaurantName = (user as any).restaurantName;
        (token as any).token = (user as any).token;
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).id = (token as any).id;
      (session.user as any).role = (token as any).role;
      (session.user as any).restaurantId = (token as any).restaurantId;
      (session.user as any).restaurantName = (token as any).restaurantName;
      (session as any).token = (token as any).token;
      return session;
    },
  },
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
