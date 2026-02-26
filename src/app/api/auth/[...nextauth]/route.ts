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
        identifier: { label: "Email ou CPF", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier) return null;

        const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
        if (!API_URL) throw new Error("API_URL ausente");

        const res = await fetch(`${API_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: credentials.identifier,
            password: credentials.password ?? "",
          }),
        });

        if (!res.ok) return null;
        const data = await res.json();

        if (!data?.user) return null;

        // Roles permitidas para login
        if (!["ADMIN", "MANAGER", "ATTENDANT"].includes(data.user.role)) return null;

        return {
          id: data.user._id ?? data.user.id,
          name: `${data.user.firstName} ${data.user.lastName ?? ""}`.trim(),
          email: data.user.email,
          role: data.user.role,
          token: data.token,
          hotelId: data.hotel?._id ?? data.user.hotel ?? null,
          unitId: data.unit?._id ?? data.user.restaurantUnit ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.hotelId = (user as any).hotelId;
        token.unitId = (user as any).unitId;
        token.token = (user as any).token;
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).id = token.id;
      (session.user as any).role = token.role;
      (session.user as any).hotelId = token.hotelId;
      (session.user as any).unitId = token.unitId;
      (session as any).token = token.token;
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };