// components/CategoryPromotionSection.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Product } from '@/stores/products/productStore';
import { Button } from '@/components/ui/button';
import { getCategoryName } from '@/utils/getCategoryName';
import { CompactPromotionCard } from './CompactPromotionCard';

interface CategoryPromotionSectionProps {
    category: string;
    products: Product[];
    onApplyPromotion?: () => void;
}

export const CategoryPromotionSection: React.FC<CategoryPromotionSectionProps> = ({
    category,
    products,
    onApplyPromotion,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const activePromotions = products.filter(p => p.isOnPromotion);
    const totalProducts = products.length;
    const productsOnPromotion = activePromotions.length;

    return (
        <div className="w-full mb-6">
            <div
                className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    <div>
                        <h3 className="font-semibold text-lg">{getCategoryName(category)}</h3>
                        <p className="text-sm text-gray-500">
                            {productsOnPromotion} de {totalProducts} produtos em promoção
                        </p>
                    </div>
                </div>
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
            </div>

            {isExpanded && (
                <div className="mt-4 overflow-x-auto">
                    <div className="flex gap-4 pb-4">
                        {activePromotions.map(product => (
                            <CompactPromotionCard
                                key={product._id}
                                product={product}
                            />
                        ))}
                        {activePromotions.length === 0 && (
                            <p className="text-gray-500 py-4 px-4">
                                Nenhuma promoção ativa nesta categoria
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
