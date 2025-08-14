'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { extractIdFromSlug } from '@/utils/slugify';
import { CartClient } from '@/components/cart/index';
import { useProductStore } from '@/stores/products';

export default function CartPage() {
    const { slug } = useParams();
    const { fetchProducts } = useProductStore();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const restaurantId = slug && extractIdFromSlug(String(slug));

    useEffect(() => {
        const fetchRestaurantProducts = async () => {
            try {
                setIsLoading(true);
                await fetchProducts(String(restaurantId));
            } catch (err: any) {
                console.error('Erro ao buscar produtos:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (restaurantId) {
            fetchRestaurantProducts();
        }
    }, [restaurantId]);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-md">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-md text-center">
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
                    <h2 className="text-lg font-bold mb-2">Erro</h2>
                    <p>Não foi possível carregar os produtos. Por favor, tente novamente mais tarde.</p>
                </div>
            </div>
        );
    }

    return <CartClient />;
}