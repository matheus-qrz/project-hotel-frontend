// components/PromotionHistory.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/services/restaurant/services';
import { Product, PromotionHistoryEntry, useProductStore } from '@/stores';
import { useParams } from 'next/navigation';
import { extractIdFromSlug } from '@/utils/slugify';

export default function PromotionHistory({ product }: { product: Product }) {
    const { slug } = useParams();
    const { getPromotionHistory, reactivatePromotion } = useProductStore();
    const [history, setHistory] = useState<PromotionHistoryEntry[]>([]);

    const restaurantId = slug && extractIdFromSlug(String(slug));

    useEffect(() => {
        loadHistory();
    }, [product._id]);

    const loadHistory = async () => {
        const historyRaw = await getPromotionHistory(product._id, product.restaurant);
        // Map or cast PromotionHistory[] to PromotionHistoryEntry[] if needed
        const history: PromotionHistoryEntry[] = historyRaw.map((item: any) => ({
            ...item,
            action: item.action ?? '', // Provide default or map as needed
            actionDate: item.actionDate ?? '',
            actionBy: item.actionBy ?? '',
            type: item.type ?? '',
        }));
        setHistory(history);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Histórico de Promoções</h2>
            {history.map((promotion) => (
                <Card key={promotion._id}>
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold">
                                    {promotion.discountPercentage}% OFF
                                </p>
                                <p className="text-sm text-gray-500">
                                    {new Date(promotion.promotionStartDate).toLocaleDateString()} -
                                    {new Date(promotion.promotionEndDate).toLocaleDateString()}
                                </p>
                                <p>
                                    De {formatCurrency(product.price)} por{' '}
                                    {formatCurrency(promotion.promotionalPrice ?? 0)}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => reactivatePromotion(product._id, promotion._id, String(restaurantId))}
                                disabled={promotion.isActive}
                            >
                                Reativar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
