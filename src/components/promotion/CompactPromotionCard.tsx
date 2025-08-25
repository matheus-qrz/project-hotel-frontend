// components/CompactPromotionCard.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Product } from "@/stores/products/productStore";
import { formatCurrency } from "@/utils/formatCurrency";
import { Pencil, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

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
    (new Date(product.promotionEndDate!).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <Card className="w-[280px] flex-shrink-0">
      <CardContent className="p-4">
        <div className="relative">
          {product.image && (
            <Image
              src={product.image}
              alt={product.name}
              className="h-32 w-full rounded-md object-cover"
            />
          )}
          <span className="absolute right-2 top-2 rounded-md bg-red-500 px-2 py-1 text-sm text-white">
            {product.discountPercentage}% OFF
          </span>
        </div>

        <div className="mt-3">
          <h3 className="truncate text-lg font-semibold">{product.name}</h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            <span>
              {new Date(product.promotionStartDate!).toLocaleDateString(
                "pt-BR",
              )}{" "}
              até{" "}
              {new Date(product.promotionEndDate!).toLocaleDateString("pt-BR")}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {daysRemaining} dias restantes
          </p>

          <div className="mt-2">
            <p className="text-sm text-gray-500 line-through">
              {formatCurrency(product.price)}
            </p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(product.promotionalPrice!)}
            </p>
          </div>

          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onEdit}
            >
              <Pencil
                size={16}
                className="mr-1"
              />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onDeactivate}
            >
              <Power
                size={16}
                className="mr-1"
              />
              Desativar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
