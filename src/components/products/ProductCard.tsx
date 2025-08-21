import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash2 } from "lucide-react";
import { Product } from "@/stores/products/productStore";

interface ProductCardProps {
  product: Product;
  quantity: number;
  onQuantityChange: (productId: string, quantity: number) => void;
  image?: string;
  imageBlur?: string;
}

type ProductImage = { url?: string; blurDataUrl?: string };

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantity,
  onQuantityChange,
  image,
  imageBlur,
}) => {
  const increaseQuantity = () => {
    onQuantityChange(String(product._id), quantity + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 0) {
      onQuantityChange(String(product._id), quantity - 1);
    }
  };

  const resetQuantity = () => {
    onQuantityChange(String(product._id), 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const blurProps = product.imageBlur
    ? { placeholder: "blur" as const, blurDataURL: product.imageBlur }
    : {};

  return (
    <Card
      className={`flex h-full flex-col overflow-hidden border border-gray-300 shadow-md ${product.isOnPromotion ? "bg-red-50" : ""}`}
    >
      {product.image && (
        <div className="relative h-24 w-full">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw,
         (max-width: 1024px) 50vw,
         33vw"
            quality={70}
            {...(product.imageBlur
              ? { placeholder: "blur" as const, blurDataURL: product.imageBlur }
              : {})}
          />
        </div>
      )}

      <CardContent className="flex flex-grow flex-col p-4">
        <div className="mb-2 flex-grow">
          <h3 className="text-lg font-medium">{product.name}</h3>
          <p className="line-clamp-2 text-sm text-gray-500">
            {product.description}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {product.isOnPromotion && product.price && (
              <span className="text-gray-500 line-through">
                {formatPrice(product.price)}
              </span>
            )}
            <span
              className={`font-bold ${product.isOnPromotion ? "text-red-600" : ""}`}
            >
              {formatPrice(product.price)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {quantity > 0 ? (
              <>
                {quantity > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
                    onClick={resetQuantity}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={decreaseQuantity}
                  >
                    <Minus size={14} />
                  </Button>
                  <span className="mx-2 w-6 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={increaseQuantity}
                  >
                    <Plus size={14} />
                  </Button>
                </div>
              </>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={increaseQuantity}
              >
                Adicionar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
