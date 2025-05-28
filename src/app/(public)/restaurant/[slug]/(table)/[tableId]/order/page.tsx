'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useOrderStore } from '@/stores/order/orderStore';
import { useCartStore } from '@/stores';
import OrdersScreen from '@/components/order/OrderScreen';

export default function OrderPage() {
    const { tableId } = useParams();
    const {
        getGuestId,
    } = useCartStore();
    const [error, setError] = useState<string | null>(null);
    const { fetchGuestOrders } = useOrderStore();

    const guestId = getGuestId();

    console.log("guestId: ", guestId);

    useEffect(() => {
        if (guestId) {
            console.log("Carregando pedidos para o guestId:", guestId);
            fetchGuestOrders(guestId, String(tableId));
        } else {
            console.error("guestId não encontrado.");
        }
    }, [guestId]);

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


    return (
        <OrdersScreen />
    );
}