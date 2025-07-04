'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { extractIdFromSlug, extractNameFromSlug } from '@/utils/slugify';

export default function RestaurantPage() {
    const { slug, tableId } = useParams();
    const router = useRouter();
    const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

    const restaurantName = slug && extractNameFromSlug(String(slug));

    useEffect(() => {
        // Função para buscar o ID do restaurante pelo nome
        async function fetchRestaurantId() {
            try {
                const response = await fetch(`/api/restaurant/by-slug/${restaurantName}`);
                if (response.ok) {
                    const restaurant = await response.json();
                    // Redirecionar para a URL com ID
                    router.push(`/${slug}${tableId}/menu`);
                } else {
                    // Restaurante não encontrado
                    router.push('/404');
                }
            } catch (error) {
                console.error('Erro ao buscar restaurante:', error);
            }
        }

        fetchRestaurantId();
    }, [slug, tableId, router]);

    return <div>Carregando...</div>;
}