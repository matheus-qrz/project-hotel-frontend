// components/PromotionHistoryPage.tsx
import React, { useEffect, useState } from 'react';
import { useProductStore } from '@/stores/products/productStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCategoryName } from '@/utils/getCategoryName';
import CategoryPromotionHistory from '@/components/promotion/CategoryPromotionHistory';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';

interface PromotionHistoryProps {
    restaurantId: string;
}

export default function PromotionHistory({ restaurantId }: PromotionHistoryProps) {
    const router = useRouter();
    const { products, fetchProducts } = useProductStore();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    useEffect(() => {
        fetchProducts(restaurantId);
    }, [fetchProducts, restaurantId]);

    const categorizedProducts = products.reduce((acc, product) => {
        if (product.category) {
            if (!acc[product.category]) {
                acc[product.category] = [];
            }
            acc[product.category].push(product);
        }
        return acc;
    }, {} as Record<string, typeof products>);

    const categories = Object.keys(categorizedProducts);

    return (
        <div className="container mx-auto p-6 overflow-x-hidden">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Histórico de Promoções</h1>
                <Button onClick={() => router.back()}>
                    Voltar
                </Button>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="all" onClick={() => setSelectedCategory('all')}>
                        Todas as Categorias
                    </TabsTrigger>
                    {categories.map((category) => (
                        <TabsTrigger
                            key={category}
                            value={category}
                            onClick={() => setSelectedCategory(category)}
                        >
                            {getCategoryName(category)}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="all">
                    {categories.map((category) => (
                        <CategoryPromotionHistory
                            key={category}
                            category={category}
                            products={categorizedProducts[category]}
                        />
                    ))}
                </TabsContent>

                {categories.map((category) => (
                    <TabsContent key={category} value={category}>
                        <CategoryPromotionHistory
                            category={category}
                            products={categorizedProducts[category]}
                        />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
