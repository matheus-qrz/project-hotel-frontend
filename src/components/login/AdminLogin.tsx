"use client";

import { useEffect, useState } from 'react';
import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores';
import { generateRestaurantSlug } from '@/utils/slugify';

export function AdminLogin() {
    const router = useRouter();
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { setToken, token } = useAuthStore();

    // Verificar se o token realmente está no Zustand
    useEffect(() => {
        const token = useAuthStore.getState().token;
        console.log('Token no Zustand:', token);
    }, []);

    useEffect(() => {
        console.log("Token atualizado: ", token)
    }, [token])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
            const response = await fetch(`${baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Falha na autenticação');
            }

            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.ok) {
                // Garantir que os dados estão no formato correto
                const restaurantId = data.restaurantInfo?.restaurantId;
                const restaurantName = data.restaurantInfo?.restaurantName;

                if (!restaurantId || !restaurantName) {
                    throw new Error('Informações do restaurante não encontradas');
                }

                // Atualizar o estado
                useAuthStore.getState().setToken(data.token);
                useAuthStore.getState().setRestaurantId(restaurantId);
                useAuthStore.getState().setUserRole(data.user.role);

                // Gerar o slug
                const slug = generateRestaurantSlug(restaurantName, restaurantId);

                // Redirecionar baseado no papel do usuário
                if (data.user.role === 'ADMIN') {
                    router.push(`/restaurant/${slug}/dashboard`);
                } else if (data.user.role === 'MANAGER') {
                    router.push(`/restaurant/${slug}/manager`);
                }
            }
        } catch (error) {
            console.error('Erro durante login:', error);
            setError('Erro ao processar login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen w-full">
            {/* Lado esquerdo - logo */}
            <div className="flex flex-col h-64 md:min-h-screen md:w-2/3 bg-black items-center justify-center p-8 relative">
                <div className="text-center">
                    <Image
                        src="/Logo.svg"
                        alt="SR. GARÇOM"
                        width={400}
                        height={150}
                        className="mx-auto"
                    />
                </div>

                <div className="absolute bottom-4 text-center text-white text-xs px-8 space-y-8">
                    <p>
                        Ao entrar você concorda com os {' '}
                        <Link href="/termos" className="underline">
                            Termos de uso
                        </Link>
                        {' '}e as{' '}
                        <Link href="/privacidade" className="underline">
                            Política de privacidade
                        </Link>
                    </p>
                </div>
            </div>


            {/* Lado direito - formulário */}
            <div className="w-full md:w-1/3 p-8 flex items-center justify-center bg-white">
                <div className="w-full max-w-md space-y-10">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="text-sm font-medium block">Email</label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Digite seu email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-1"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="text-sm font-medium block">Senha</label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Digite sua senha"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <Link href="/recover-password" className="text-sm hover:underline">
                                Esqueceu sua senha?
                            </Link>
                            <Button
                                type="submit"
                                className="bg-black text-white hover:bg-gray-800"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Entrando...
                                    </>
                                ) : (
                                    "Entrar"
                                )}
                            </Button>
                        </div>
                    </form>

                    <div className="pt-6 border-t border-gray-200">
                        <p className="text-center text-sm text-gray-500">Não tem uma conta?</p>
                        <Link
                            href="/admin/register"
                            className="block mt-2 text-center text-sm py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 w-full"
                        >
                            Criar uma conta agora
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
