// components/PromotionCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Power, Clock, Calendar } from 'lucide-react';
import Image from 'next/image';
import { formatCurrency } from '@/utils/formatCurrency';
import { Product } from '@/stores';

// Primeiro, vamos criar um tipo específico para o card que estende o Product
type PromotionCardProduct = Required<Pick<Product, '_id' | 'name' | 'price' | 'isOnPromotion'>> & {
    description: string;
    image: string;
    discountPercentage: number;
    promotionalPrice: number;
    promotionStartDate: string;
    promotionEndDate: string;
};

// Interface para as props do card
interface PromotionCardProps {
    product: PromotionCardProduct;
    onEdit: () => void;
    onDeactivate: () => void;
}

export const PromotionCard: React.FC<PromotionCardProps> = ({
    product,
    onEdit,
    onDeactivate,
}) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const daysRemaining = () => {
        if (!product.promotionEndDate) return 0;
        const end = new Date(product.promotionEndDate);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader className="p-0">
                {product.image && (
                    <div className="relative h-40 w-full">
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            style={{ objectFit: 'cover' }}
                        />
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full">
                            {product.discountPercentage}% OFF
                        </div>
                    </div>
                )}
            </CardHeader>
            <CardContent className="p-4">
                <div className="mb-4">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Calendar size={16} />
                        <span>
                            {formatDate(product.promotionStartDate!)} até{' '}
                            {formatDate(product.promotionEndDate!)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock size={16} />
                        <span>{daysRemaining()} dias restantes</span>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <div>
                        <span className="text-sm text-gray-500 line-through">
                            {formatCurrency(product.price)}
                        </span>
                        <span className="text-lg font-bold text-green-600 ml-2">
                            {formatCurrency(product.promotionalPrice!)}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onEdit}
                        >
                            <Edit2 size={16} />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onDeactivate}
                            className="text-red-500 hover:text-red-700"
                        >
                            <Power size={16} />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

