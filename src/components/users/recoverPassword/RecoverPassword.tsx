"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Logo from "@/../public/Logo.svg";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ArrowRight } from "lucide-react";

export function RecoverPassword() {
    const router = useRouter();
    const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const isMobile = useMediaQuery("(max-width: 768px)");

    const recoverPasswordMutation = useMutation({
        mutationFn: async (credentials: { email: string; }) => {
            const response = await fetch(`${API_URL}/recover-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(credentials),
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Credenciais inválidas.");
            }

            return response.json();
        },
        onSuccess: (data) => {
            // Store the session token (if needed)
            if (data.sessionToken) {
                localStorage.setItem("session", data.sessionToken);
            }

            // Redirect to appropriate route
            router.push(data.redirectRoute || "/admin");
        },
        onError: (error) => {
            setError(error instanceof Error ? error.message : "Erro no login. Verifique suas credenciais.");
            console.error("Erro no login:", error);
        }
    });


    const handleUserRecoverPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        recoverPasswordMutation.mutate({ email });
    };

    return (
        <div className="min-h-screen w-full flex flex-col md:flex-row">
            {/* Lado esquerdo - formulário de recuperação de senha */}
            <div className="w-full md:w-1/3 flex items-center justify-center p-4">
                <div className="w-full max-w-md flex flex-col items-center p-8">
                    {/* Título e instruções movidos para cima com maior espaçamento */}
                    <div className="w-full text-center mb-10">
                        <h1 className="text-2xl font-semibold mb-4">Recuperação de Senha</h1>
                        <p className="text-gray-600 justify-start text-start">
                            Insira seu e-mail para que possamos enviar uma mensagem para uma nova senha.
                        </p>
                    </div>

                    {/* Formulário centralizado */}
                    <form
                        onSubmit={handleUserRecoverPassword}
                        id="login-user"
                        className="w-full space-y-6"
                    >
                        <div className="flex flex-col space-y-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="email" className={isMobile ? "sr-only" : "text-gray-700"}>Email</Label>
                                <Input
                                    type="email"
                                    id="user-email"
                                    name="email"
                                    placeholder="Digite seu e-mail"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full border border-border rounded-md"
                                />
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-6">
                            <Button
                                variant="ghost"
                                onClick={() => router.push('/')}
                                className="text-sm text-gray-600 hover:underline"
                            >
                                Voltar
                            </Button>
                            <Button
                                type="submit"
                                className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 inline-flex items-center"
                                disabled={recoverPasswordMutation.isPending}
                                aria-disabled={recoverPasswordMutation.isPending}
                            >
                                {recoverPasswordMutation.isPending ? "Enviando..." : "Entrar"}
                                <ArrowRight className="ml-2" />
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="w-full md:w-2/3 bg-black flex flex-col items-center justify-center p-8">
                <div className="flex-1 flex items-center justify-center">
                    <Image
                        priority
                        src={Logo}
                        alt="SR. GARÇOM"
                        width={400}
                        height={120}
                    />
                </div>
                <div className="text-white text-center text-sm mt-auto">
                    <p>
                        Ao entrar você concorda com os <Link href="#" className="underline text-white">Termos de uso</Link> e as <Link href="#" className="underline text-white">Política de privacidade</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}