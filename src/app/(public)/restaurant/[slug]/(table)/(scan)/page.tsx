'use client'

import React from 'react';
import { getRestaurantBySlug } from '@/services/restaurant/services';
import { extractIdFromSlug } from '@/utils/slugify';
import { notFound, useParams } from 'next/navigation';
import ScanClient from '@/components/QRScan/ScanClient';

export default async function ScanPage() {
    const { slug, tableId } = useParams();
    const restaurantId = extractIdFromSlug(String(slug));

    try {
        const restaurant = await getRestaurantBySlug(String(slug));

        if (!restaurant) {
            notFound();
        }

        return (
            <div className="container mx-auto px-4 py-6">
                <ScanClient
                    restaurantName={String(slug)}
                    restaurantId={restaurantId}
                    tableId={String(tableId)}
                />
            </div>
        );
    } catch (error) {
        console.error('Erro ao carregar dados do restaurante:', error);
        return (
            <div className="container mx-auto px-4 py-6">
                <h1 className="text-xl font-bold mb-4">Erro ao carregar scanner</h1>
                <p>Não foi possível carregar os dados necessários. Tente novamente mais tarde.</p>
            </div>
        );
    }
}