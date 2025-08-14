
// components/CompactPromotionCard.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Product } from '@/stores/products/productStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { Pencil, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompactPromotionCardProps {
    product: Product;
    onEdit?: () => void;
    onDeactivate?: () => void;
}

export const CompactPromotionCard: React.FC<CompactPromotionCardProps> = ({
    product,
    onEdit,
    onDeactivate,
}) => {
    const daysRemaining = Math.ceil(
        (new Date(product.promotionEndDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
        <Card className="w-[280px] flex-shrink-0">
            <CardContent className="p-4">
                <div className="relative">
                    {product.image && (
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-32 object-cover rounded-md"
                        />
                    )}
                    <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm">
                        {product.discountPercentage}% OFF
                    </span>
                </div>

                <div className="mt-3">
                    <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <span>
                            {new Date(product.promotionStartDate!).toLocaleDateString('pt-BR')} até{' '}
                            {new Date(product.promotionEndDate!).toLocaleDateString('pt-BR')}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500">{daysRemaining} dias restantes</p>

                    <div className="mt-2">
                        <p className="text-sm text-gray-500 line-through">
                            {formatCurrency(product.price)}
                        </p>
                        <p className="font-semibold text-green-600 text-lg">
                            {formatCurrency(product.promotionalPrice!)}
                        </p>
                    </div>

                    <div className="flex gap-2 mt-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={onEdit}
                        >
                            <Pencil size={16} className="mr-1" />
                            Editar
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={onDeactivate}
                        >
                            <Power size={16} className="mr-1" />
                            Desativar
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};