'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserLogin } from '@/components/login/UserLogin';
import { GuestLogin } from '@/components/login/GuestLogin';
import { useAuthCheck } from '@/hooks/sessionManager';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { extractIdFromSlug } from '@/utils/slugify';

export function LoginPage() {
    const router = useRouter();
    const { slug, tableId } = useParams();
    const { authenticateAsGuest, isAuthenticated, role, isLoading } = useAuthCheck();
    const [restaurantInfo, setRestaurantInfo] = useState<{ name: string } | null>(null);

    const restaurantId = slug && extractIdFromSlug(String(slug));

    // Redirecionar se já estiver autenticado
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            if (role === 'ADMIN') {
                router.push(`/admin/restaurant/${slug}/dashboard`);
            } else if (role === 'MANAGER') {
                router.push(`/admin/restaurant/${slug}/dashboard`);
            } else if (role === 'ATTENDANT') {
                router.push('/attendant/orders');
            } else if (role === 'CLIENT' || 'GUEST') {
                // Para cliente ou convidado, redirecionar conforme params
                if (restaurantId) {
                    router.push(`/restaurant/${restaurantId}/${tableId}/menu`);
                } else {
                    router.push('/');
                }
            }
        }
    }, [isAuthenticated, slug, role, isLoading, router, restaurantId]);

    // Buscar informações do restaurante
    useEffect(() => {
        if (restaurantId) {
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/restaurant/${restaurantId}`)
                .then(res => res.json())
                .then(data => {
                    setRestaurantInfo(data);

                    // Salvar informações da mesa para uso futuro
                    if (tableId) {
                        localStorage.setItem(`table-${data.name.toLowerCase().replace(/\s+/g, '-')}`, String(tableId));
                    }
                })
                .catch(err => console.error("Erro ao buscar restaurante:", err));
        }
    }, [restaurantId, tableId]);

    // Função para continuar sem login
    const continueWithoutLogin = () => {
        if (restaurantId && tableId && restaurantInfo) {
            // Usar função do contexto de autenticação para autenticar como convidado anônimo
            authenticateAsGuest(
                String(tableId),
                restaurantId,
                restaurantInfo.name.toLowerCase().replace(/\s+/g, '-')
            );

            router.push(`/restaurant/${restaurantId}/${tableId}/menu`);
        } else if (restaurantId) {
            // Mesmo sem tableId, permitir acesso ao menu
            router.push(`/restaurant/${restaurantId}/${tableId}/menu`);
        }
    };

    // Mostrar loader enquanto verifica autenticação
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col md:flex-row bg-secondary">
            {/* Lado esquerdo - formulário de login */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold mb-6">Bem-vindo</h1>

                    {/* Mostrar informações da mesa se vier de um QR code */}
                    {restaurantId && tableId && restaurantInfo && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm font-medium">
                                {restaurantInfo.name}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium">Mesa:</span> {tableId}
                            </p>
                        </div>
                    )}

                    <Tabs defaultValue="user" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="user">Usuário</TabsTrigger>
                            <TabsTrigger value="guest">Convidado</TabsTrigger>
                        </TabsList>

                        <TabsContent value="user">
                            <UserLogin
                                onLoginSuccess={() => {
                                    router.push(`/restaurant/${restaurantId}/${tableId}/menu`);
                                }}
                            />
                        </TabsContent>

                        <TabsContent value="guest">
                            <GuestLogin />
                        </TabsContent>
                    </Tabs>

                    {/* Botão para continuar sem login */}
                    <div className="mt-6">
                        <button
                            onClick={continueWithoutLogin}
                            className="w-full py-2 text-gray-600 text-sm underline hover:text-gray-900"
                        >
                            Continuar sem login
                        </button>
                    </div>

                    <div className="mt-8 text-center text-sm text-gray-500">
                        <p>
                            Não tem uma conta?{' '}
                            <Link
                                href={restaurantId
                                    ? `/register?restaurantId=${restaurantId}&tableId=${tableId || ''}`
                                    : "/register"
                                }
                                className="text-blue-600 hover:underline"
                            >
                                Cadastre-se
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Lado direito - imagem ou logo */}
            <div className="hidden md:block md:w-1/2 bg-gradient-to-r from-blue-500 to-indigo-600">
                <div className="h-full flex flex-col items-center justify-center text-white p-8">
                    <h2 className="text-3xl font-bold mb-4">Sr. Garçom</h2>
                    <p className="text-xl max-w-md text-center">
                        Faça seus pedidos de forma rápida e prática, sem complicações!
                    </p>
                </div>
            </div>
        </div>
    );
}