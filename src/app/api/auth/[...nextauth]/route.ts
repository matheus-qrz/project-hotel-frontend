import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

interface iUser {
    id: string;
    name: string;
    email: string;
    role: string;
    token: string;
    restaurantId?: string;
}

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Por favor, insira seu email e senha.");
                }

                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);

                    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
                    console.log(`Tentando login em: ${baseUrl}/login`);

                    const response = await fetch(`${baseUrl}/login`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password
                        }),
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        console.log("Erro do servidor:", response.status);
                        const errorData = await response.json();
                        throw new Error(errorData.error || "Credenciais inválidas");
                    }

                    const data = await response.json();
                    console.log("Dados do login:", JSON.stringify(data));

                    // Verifica se é resposta de restaurant ou user
                    if (data.restaurant && data.user) {
                        if (!["ADMIN", "MANAGER"].includes(data.user.role)) {
                            throw new Error("Acesso negado. Apenas ADMIN e MANAGER podem acessar.");
                        }

                        return {
                            id: data.restaurant._id,
                            name: data.restaurant.admin.fullName,
                            email: data.restaurant.admin.email,
                            role: data.user.role,
                            token: data.token,
                            restaurantId: data.restaurant._id
                        } as iUser;
                    } else if (data.user) {
                        // Verifica se o usuário é ADMIN ou MANAGER
                        if (data.user.role !== "ADMIN" && data.user.role !== "MANAGER") {
                            throw new Error("Acesso negado. Apenas ADMIN e MANAGER podem acessar.");
                        }

                        return {
                            id: data.user._id,
                            name: data.user.firstName,
                            email: data.user.email,
                            role: data.user.role,
                            token: data.token,
                            restaurantId: data.user.restaurantId || data.user._id // Ajustado para usar restaurantId se disponível
                        } as iUser;
                    }

                    throw new Error("Formato de resposta inválido");
                } catch (error) {
                    console.error("Erro de autenticação:", error);
                    if (error instanceof Error && error.name === 'AbortError') {
                        throw new Error("Timeout na conexão com o servidor");
                    }
                    throw new Error("Falha na autenticação");
                }
            }
        })
    ],
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60 // 30 dias
    },
    debug: process.env.NODE_ENV === "development",
    // Aumentando o tempo de expiração do token
    jwt: {
        maxAge: 30 * 24 * 60 * 60, // 30 dias em segundos
    },
    cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
                maxAge: 30 * 24 * 60 * 60 // 30 dias
            }
        }
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                return {
                    ...token,
                    id: user.id,
                    role: user.role,
                    token: user.token,
                    restaurantId: user.restaurantId
                };
            }
            return token;
        },
        async session({ session, token }) {
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.id,
                    role: token.role,
                    restaurantId: token.restaurantId
                },
                token: token.token
            };
        }
    }
});

export { handler as GET, handler as POST };