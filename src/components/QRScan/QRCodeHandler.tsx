'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';

export default function QRCodeHandler() {
    const params = useParams();
    const router = useRouter();
    const restaurantId = params.restaurantId as string;
    const tableId = params.tableId as string;

    useEffect(() => {
        // Salvar a mesa no localStorage
        localStorage.setItem(`table-${restaurantId}`, tableId);

        // Criar token de convidado para autenticação
        createGuestAuth(restaurantId, Number(tableId));

        // Redirecionar para a página da mesa
        router.push(`/restaurant/${restaurantId}/table/${tableId}`);
    }, [restaurantId, tableId, router]);

    const createGuestAuth = (restaurantId: string, tableId: number) => {
        // Criar um token temporário para convidado
        const guestToken = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('guest_token', guestToken);

        // Opcionalmente, poderia fazer uma chamada API para registrar o convidado no sistema
        console.log(`Guest authentication created for restaurant ${restaurantId}, table ${tableId}`);
    };

    return (
        <div className="container mx-auto px-4 py-16 text-center">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-4 w-64 mx-auto" />
        </div>
    );
}