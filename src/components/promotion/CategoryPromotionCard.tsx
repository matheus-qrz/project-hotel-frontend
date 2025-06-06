// components/CategoryPromotionCard.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Product } from '@/stores/products/productStore';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { formatCurrency } from '@/services/restaurant/services';
import { getCategoryName } from '@/utils/getCategoryName';

interface CategoryPromotionCardProps {
    category: string;
    products: Product[];
    onApplyPromotion?: () => void;
}

export const CategoryPromotionCard: React.FC<CategoryPromotionCardProps> = ({
    category,
    products,
    onApplyPromotion,
}) => {
    // Usar o ID da categoria no estado para torná-lo único
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

    const toggleCategory = (categoryId: string) => {
        setOpenCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    const isOpenCategory = openCategories[category] || false;

    const activePromotions = products.filter(p => p.isOnPromotion);
    const totalProducts = products.length;
    const productsOnPromotion = activePromotions.length;

    return (
        <Card>
            <Collapsible
                open={isOpenCategory}
                onOpenChange={() => toggleCategory(category)}
            >
                <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-lg">{getCategoryName(category)}</h3>
                            <p className="text-sm text-gray-500">
                                {productsOnPromotion} de {totalProducts} produtos em promoção
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onApplyPromotion?.();
                                }}
                            >
                                <Plus size={16} className="mr-1" />
                                Promoção
                            </Button>
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {isOpenCategory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                    </div>
                </CardHeader>

                <CollapsibleContent>
                    <CardContent className="p-4 pt-0">
                        <div className="space-y-2">
                            {activePromotions.map(product => (
                                <div
                                    key={product._id}
                                    className="flex items-center justify-between py-2 border-b last:border-0"
                                >
                                    <div>
                                        <p className="font-medium">{product.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {product.discountPercentage}% OFF até{' '}
                                            {new Date(product.promotionEndDate!).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500 line-through">
                                            {formatCurrency(product.price)}
                                        </p>
                                        <p className="font-semibold text-green-600">
                                            {formatCurrency(product.promotionalPrice!)}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {activePromotions.length === 0 && (
                                <p className="text-center text-gray-500 py-4">
                                    Nenhuma promoção ativa nesta categoria
                                </p>
                            )}
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
};