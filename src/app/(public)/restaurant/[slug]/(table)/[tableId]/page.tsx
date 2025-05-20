'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRestaurantStore, useTableStore, useCartStore } from '@/stores/';
import { extractIdFromSlug } from '@/utils/slugify';
import { Button } from '@/components/ui/button';
import { Book } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GuestLogin, UserLogin } from '@/components/login';
import { DelayedLoading } from '@/components/loading/DelayedLoading';
import { v4 as uuidv4 } from 'uuid';
import { Label } from '@/components/ui/label';

interface GuestInfo {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    tableNumber: string;
    restaurantId: string;
}

export default function TableIdentificationPage() {
    const { slug, tableId } = useParams();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Stores
    const { restaurant, fetchRestaurantData } = useRestaurantStore();
    const { setTableInfo } = useTableStore();
    const { setTableInfo: setCartTableInfo } = useCartStore();

    useEffect(() => {
        const initializeData = async () => {
            if (!slug || !tableId) {
                setError('Parâmetros inválidos');
                return;
            }

            try {
                setIsLoading(true);
                await fetchRestaurantData(String(slug));

                const restaurantId = extractIdFromSlug(String(slug));

                setTableInfo(String(tableId), restaurantId);
                setCartTableInfo(String(tableId), restaurantId);

                console.log("ids: ", tableId, restaurantId);

                // Verificar se já existe uma sessão de guest
                const existingGuestInfo = localStorage.getItem('guest_info');
                if (existingGuestInfo) {
                    const guestData = JSON.parse(existingGuestInfo);
                    // Atualizar informações da mesa se necessário
                    if (guestData.tableId !== String(tableId) || guestData.restaurantId !== restaurantId) {
                        const updatedGuestInfo: GuestInfo = {
                            ...guestData,
                            tableNumber: String(tableId),
                            restaurantId: restaurantId
                        };
                        localStorage.setItem('guest_info', JSON.stringify(updatedGuestInfo));
                    }
                }

            } catch (error: any) {
                console.error('Erro ao carregar dados:', error);
                setError(error.message || 'Erro ao carregar informações do restaurante.');
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
    }, [slug, tableId, fetchRestaurantData, setTableInfo, setCartTableInfo]);

    const navigateToMenu = () => {
        if (!slug) return;
        router.push(`/restaurant/${slug}/${tableId}/menu`);
    };

    const handleLoginSuccess = () => {
        navigateToMenu();
    };

    const continueAsGuest = () => {
        const restaurantId = extractIdFromSlug(String(slug));

        // Criar guest anônimo
        const anonymousGuest: GuestInfo = {
            id: uuidv4(),
            name: `Mesa ${tableId}`,
            tableNumber: String(tableId),
            restaurantId: restaurantId
        };

        localStorage.setItem('guest_info', JSON.stringify(anonymousGuest));

        // Gerar token para guest anônimo
        const guestToken = btoa(`${anonymousGuest.id}:${anonymousGuest.tableNumber}:${Date.now()}`);
        localStorage.setItem('guest_token', guestToken);

        navigateToMenu();
    };

    if (isLoading) {
        return <DelayedLoading />;
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-16 max-w-md flex flex-col items-center justify-center min-h-[70vh]">
                <div className="text-center mb-6">
                    <h1 className="text-xl font-bold text-red-600 mb-2">Erro</h1>
                    <p className="text-gray-600">{error}</p>
                </div>
                <Button
                    onClick={() => router.push('/')}
                    variant="outline"
                >
                    Voltar à Página Inicial
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-md min-h-[90vh] flex flex-col">
            <div className="text-center mb-6">
                <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
                    <Book size={40} className="text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-primary mb-2">Mesa {tableId}</h1>
                {restaurant && (
                    <p className="text-gray-600 mb-4">
                        Você está acessando o cardápio digital de {restaurant.name}
                    </p>
                )}
            </div>

            {/* <div className="flex-grow mb-6">
                <Tabs defaultValue="user" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="user">Usuário</TabsTrigger>
                        <TabsTrigger value="guest">Convidado</TabsTrigger>
                    </TabsList>

                    <TabsContent value="user" className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <p className="text-sm">Faça login para acessar sua conta e visualizar histórico de pedidos.</p>
                        </div>
                        <UserLogin onLoginSuccess={handleLoginSuccess} />
                    </TabsContent>

                    <TabsContent value="guest" className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <p className="text-sm">Identifique-se para facilitar seus pedidos.</p>
                        </div>
                        <GuestLogin />
                    </TabsContent>
                </Tabs>
            </div> */}

            <div className='flex flex-col flex-grow justify-start gap-2'>
                <div className='flex flex-col items-center justify-center gap-4'>
                    <Label className='font-bold text-xl'>Seja bem vindo, cliente!</Label>
                    <div className="rounded-lg mb-8">
                        <p className="text-md">Identifique-se para facilitar seus pedidos.</p>
                    </div>
                </div>

                <GuestLogin />

                <div className="flex items-center w-full my-4">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="mx-4 text-sm text-gray-500">ou</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                </div>
                <Button
                    onClick={continueAsGuest}
                    variant="default"
                    className="w-full"
                >
                    Ver Cardápio
                </Button>
            </div>
        </div>
    );
}