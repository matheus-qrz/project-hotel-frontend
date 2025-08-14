/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';
import { generateRestaurantSlug } from '@/utils/slugify';
import { DelayedLoading } from '@/components/loading/DelayedLoading';

export function AdminLogin() {
    const router = useRouter();
    const { slug } = useParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { isAuthenticated, hasHydrated, setAuthenticated, isLoading, setLoading } = useAuthStore();

    useEffect(() => {
        if (hasHydrated && isAuthenticated) {
            router.push(`/admin/restaurant/${slug}/dashboard`);
        }
    }, [hasHydrated, isAuthenticated]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Falha na autenticação');
            }

            const { token, user, restaurantInfo } = data;

            if (!token || !user || !restaurantInfo?.restaurantId) {
                throw new Error('Dados de autenticação incompletos');
            }

            setAuthenticated(token);

            const slug = generateRestaurantSlug(restaurantInfo.restaurantName, restaurantInfo.restaurantId);

            if (user.role === 'ADMIN') {
                router.push(`/admin/restaurant/${slug}/dashboard`);
            } else if (user.role === 'MANAGER') {
                router.push(`/admin/restaurant/${slug}/manager`);
            }
        } catch (err) {
            console.error('Erro no login:', err);
            setError('Erro ao processar login');
        } finally {
            setLoading(false);
        }
    };

    if (isLoading) return <DelayedLoading />;

    return (
        <div className="flex flex-col md:flex-row min-h-screen w-full">
            <div className="flex flex-col h-64 md:min-h-screen md:w-2/3 bg-black items-center justify-center p-8 relative">
                <Image src="/Logo.svg" alt="SR. GARÇOM" width={400} height={150} className="mx-auto" />
                <div className="absolute bottom-4 text-white text-xs text-center px-8 space-y-8">
                    <p>
                        Ao entrar você concorda com os{' '}
                        <Link href="/termos" className="underline">Termos de uso</Link> e a{' '}
                        <Link href="/privacidade" className="underline">Política de privacidade</Link>
                    </p>
                </div>
            </div>

            <div className="w-full md:w-1/3 p-8 flex items-center justify-center bg-white">
                <div className="w-full max-w-md space-y-10">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className='flex flex-col gap-2'>
                                <label htmlFor="email" className="text-sm font-medium block">Email</label>
                                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            <div className='flex flex-col gap-2'>
                                <label htmlFor="password" className="text-sm font-medium block">Senha</label>
                                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <Link href="/recover-password" className="text-sm hover:underline">Esqueceu sua senha?</Link>
                            <Button type="submit" className="bg-black text-white hover:bg-gray-800" disabled={isLoading}>
                                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando...</> : "Entrar"}
                            </Button>
                        </div>
                    </form>

                    <div className="pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                        <p>Não tem uma conta?</p>
                        <Link href="/admin/register" className="block mt-2 py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50">
                            Criar uma conta agora
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
