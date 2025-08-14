'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRestaurantStore, useTableStore, useCartStore } from '@/stores';
import { extractIdFromSlug } from '@/utils/slugify';
import { Button } from '@/components/ui/button';
import { Book } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { DelayedLoading } from '@/components/loading/DelayedLoading';
import { GuestLogin } from '@/components/login';
import { useGuestStore } from '@/stores/auth';
import { v4 as uuidv4 } from 'uuid';

export default function TableIdentificationPage() {
    const { slug, tableId } = useParams();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { restaurant, fetchRestaurantBySlug } = useRestaurantStore();
    const { setTableInfo } = useTableStore();
    const { setTableInfo: setCartTableInfo } = useCartStore();
    const {
        guestInfo,
        setGuestInfo,
        setRestaurantId,
        setTableId,
    } = useGuestStore();

    useEffect(() => {
        const initializeData = async () => {
            if (!slug || !tableId) {
                setError('Parâmetros inválidos');
                return;
            }

            try {
                setIsLoading(true);
                await fetchRestaurantBySlug(String(slug));

                const restaurantId = extractIdFromSlug(String(slug));
                const tableIdNum = Number(tableId);

                setTableInfo(tableIdNum, restaurantId);
                setCartTableInfo(tableIdNum, restaurantId);
                setRestaurantId(restaurantId);
                setTableId(tableIdNum);

                // Se o guestInfo já existe, manter (persist é automático)
            } catch (error: any) {
                console.error('Erro ao carregar dados:', error);
                setError(error.message || 'Erro ao carregar informações do restaurante.');
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
    }, [slug, tableId]);

    const navigateToMenu = () => {
        if (!slug) return;
        router.push(`/restaurant/${slug}/${tableId}/menu`);
    };

    const continueAsGuest = () => {
        const restaurantId = extractIdFromSlug(String(slug));
        const anonymousGuest = {
            id: uuidv4(),
            name: `Mesa ${tableId}`,
            joinedAt: new Date().toISOString(),
        };

        setGuestInfo(anonymousGuest);
        setRestaurantId(restaurantId);
        setTableId(Number(tableId));

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
                <Button onClick={() => router.push('/')} variant="outline">
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

            <div className='flex flex-col flex-grow justify-start gap-2'>
                <div className='flex flex-col items-center justify-center gap-4'>
                    <Label className='font-bold text-xl'>Seja bem-vindo!</Label>
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

                <Button onClick={continueAsGuest} variant="default" className="w-full">
                    Ver Cardápio
                </Button>
            </div>
        </div>
    );
}
