'use client'

import React from 'react';
import { useRestaurantStore } from '@/stores/restaurant/restaurantStore';
import { extractIdFromSlug } from '@/utils/slugify';
import { useParams } from 'next/navigation';
import ScanClient from '@/components/QRScan/ScanClient';

export default async function ScanPage() {
    const { slug, tableId } = useParams();
    const { fetchRestaurantBySlug } = useRestaurantStore();
    const restaurantId = extractIdFromSlug(String(slug));

    const restaurant = fetchRestaurantBySlug(String(slug));

    if (!restaurant) {
        return (
            <div className="container mx-auto px-4 py-6">
                <h1 className="text-xl font-bold mb-4">Erro ao carregar scanner</h1>
                <p>Não foi possível carregar os dados necessários. Tente novamente mais tarde.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <ScanClient
                restaurantName={String(slug)}
                restaurantId={restaurantId}
                tableId={Number(tableId)}
            />
        </div>
    );
}