import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatCurrency';
import { getCategoryName } from '@/utils/getCategoryName';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CategoryPromotionHistoryProps {
    category: string;
    products: Array<any>;
}

const CategoryPromotionHistory: React.FC<CategoryPromotionHistoryProps> = ({
    category,
    products
}) => {
    const getPromotionStatus = (endDate: string | null) => {
        if (!endDate) return 'inactive';
        const now = new Date();
        const end = new Date(endDate);
        return now > end ? 'expired' : 'active';
    };

    const formatDate = (date: string) => {
        return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    };

    return (
        <Card className="mb-6">
            <CardHeader>
                <h2 className="text-xl font-semibold">{getCategoryName(category)}</h2>
                <p className="text-sm text-gray-500">
                    {products.filter(p => p.isOnPromotion || p.promotionHistory?.length > 0).length} produtos com histórico de promoções
                </p>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead>Preço Original</TableHead>
                            <TableHead>Desconto</TableHead>
                            <TableHead>Preço Promocional</TableHead>
                            <TableHead>Período</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => {
                            const hasActivePromotion = product.isOnPromotion;
                            const promotions = [
                                ...(hasActivePromotion
                                    ? [{
                                        discountPercentage: product.discountPercentage,
                                        promotionalPrice: product.promotionalPrice,
                                        promotionStartDate: product.promotionStartDate,
                                        promotionEndDate: product.promotionEndDate,
                                        isActive: true
                                    }]
                                    : []),
                                ...(product.promotionHistory || [])
                            ];

                            return promotions.map((promotion, index) => (
                                <TableRow key={`${product._id}-${index}`}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{product.name}</p>
                                            {index === 0 && hasActivePromotion && (
                                                <Badge className="bg-green-500">Promoção Atual</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{formatCurrency(product.price)}</TableCell>
                                    <TableCell>{promotion.discountPercentage}%</TableCell>
                                    <TableCell>{formatCurrency(promotion.promotionalPrice)}</TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            <p>{formatDate(promotion.promotionStartDate)} - {formatDate(promotion.promotionEndDate)}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={
                                                promotion.isActive
                                                    ? 'bg-green-500'
                                                    : getPromotionStatus(promotion.promotionEndDate) === 'expired'
                                                        ? 'bg-red-500'
                                                        : 'bg-gray-500'
                                            }
                                        >
                                            {promotion.isActive
                                                ? 'Ativa'
                                                : getPromotionStatus(promotion.promotionEndDate) === 'expired'
                                                    ? 'Expirada'
                                                    : 'Inativa'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {!promotion.isActive && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    // Implementar reativação da promoção
                                                }}
                                            >
                                                Reativar
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ));
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default CategoryPromotionHistory;