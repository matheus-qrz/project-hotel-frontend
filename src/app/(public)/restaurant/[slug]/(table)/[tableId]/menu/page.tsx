'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { extractIdFromSlug } from '@/utils/slugify';
import MenuClient from '@/components/menu';
import { useProductStore } from '@/stores/products';
import { DelayedLoading } from '@/components/loading/DelayedLoading';

const getCategoryOrder = (category: string): number => {
    const orderMap: { [key: string]: number } = {
        'promotion': 0,
        'combos': 1,
        // Promoções
        'appetizers': 2,     // Entradas
        'main': 3,          // Pratos Principais
        'sides': 4,          // Acompanhamentos
        'drinks': 5,      // Bebidas
        'desserts': 6,       // Sobremesas
        'other': 7          // Outras categorias
    };

    return orderMap[category] ?? 999;
};

export default function MenuPage() {
    const { slug } = useParams();
    const { products, loading, fetchProducts } = useProductStore();

    const restaurantId = slug && extractIdFromSlug(String(slug));

    useEffect(() => {
        if (restaurantId) {
            fetchProducts(restaurantId);
        }
    }, [restaurantId, fetchProducts]);

    if (loading) {
        return <DelayedLoading />;
    }

    // Obtém categorias únicas e ordena conforme a ordem definida
    const categories = Array.from(new Set(products.map(product => product.category)))
        .sort((a, b) => getCategoryOrder(a) - getCategoryOrder(b));

    return (
        <MenuClient
            slug={String(slug)}
            initialCategories={categories}
        />
    );
}