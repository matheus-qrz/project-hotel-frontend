'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { extractIdFromSlug, extractNameFromSlug } from '@/utils/slugify';
import OrderConfirmation from '@/components/order/OrderConfirmation';
import { useOrderStore, Order } from '@/stores/order/orderStore';
import { getRestaurantById } from '@/services/restaurant/services';
import { useCartStore } from '@/stores';

export default function OrderPage() {
    const { slug, tableId, orderId, unitId } = useParams();
    const searchParams = useSearchParams();
    const splitCount = searchParams.get('split') ? parseInt(searchParams.get('split')!) : 1;
    const router = useRouter();

    const {
        getGuestId,
    } = useCartStore();

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [restaurantData, setRestaurantData] = useState<{
        id: string;
        name: string;
    } | null>(null);

    const { order, fetchTableOrders } = useOrderStore();

    const guestId = getGuestId();

    const restaurantId = slug && extractIdFromSlug(String(slug));
    const restaurantName = slug && extractNameFromSlug(String(slug));

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                if (!restaurantId || !tableId) {
                    throw new Error("Informações do restaurante não encontradas.");
                }

                // Carregar dados do restaurante
                const restaurant = await getRestaurantById(restaurantId);
                if (!restaurant) {
                    throw new Error("Restaurante não encontrado.");
                }
                setRestaurantData({
                    id: restaurant._id,
                    name: restaurant.name
                });

                // Carregar pedidos da mesa
                if (unitId) {
                    await fetchTableOrders(String(unitId), String(tableId), String(guestId));
                } else {
                    await fetchTableOrders(restaurantId, String(tableId), String(guestId));
                }

            } catch (err: any) {
                console.error("Erro ao carregar dados:", err);
                setError(err.message || "Erro ao carregar dados.");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [restaurantId, tableId, fetchTableOrders]);

    const handleBackToMenu = () => {
        router.push(`/restaurant/${slug}/${tableId}/menu`);
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-md">
                <div className="animate-pulse">
                    <div className="h-16 w-16 bg-green-100 rounded-full mx-auto mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
                    <div className="h-48 bg-gray-200 rounded mb-6"></div>
                    <div className="h-48 bg-gray-200 rounded mb-8"></div>
                    <div className="h-12 bg-gray-200 rounded mb-3"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-md text-center">
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
                    <h2 className="text-lg font-bold mb-2">Erro</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    // Encontrar o pedido específico nos pedidos carregados
    const orderData = order.find((order: Order) => order._id === orderId);

    if (!orderData) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-md text-center">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg mb-6">
                    <h2 className="text-lg font-bold mb-2">Pedido não encontrado</h2>
                    <p>Não foi possível encontrar os detalhes deste pedido.</p>
                </div>
            </div>
        );
    }

    return (
        <OrderConfirmation
            orderId={String(orderId)}
            restaurantId={String(restaurantId)}
            restaurantName={restaurantData?.name || String(restaurantName)}
            tableId={String(tableId)}
            splitCount={splitCount}
            onBackToMenu={handleBackToMenu}
        />
    );
}