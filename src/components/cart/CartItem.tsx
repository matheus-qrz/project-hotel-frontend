// components/cart/CartItem.tsx
import React from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores";
import { OrderItemStatusType } from "@/stores/order/types/order.types";
import { formatCurrency } from "@/utils/formatCurrency";

interface Addon {
  id: string;
  name: string;
  price: number;
  quantity?: number;
}

interface CartItemProps {
  id: string;
  name: string;
  price: number;
  image?: string;
  costPrice: number;
  quantity: number;
  itemStatus: OrderItemStatusType;
  guestId: string;
  addons?: Addon[];
}

export const CartItem: React.FC<CartItemProps> = ({
  id,
  name,
  price,
  costPrice,
  quantity,
  addons,
}) => {
  const { updateQuantity, removeItem, getTotal } = useCartStore();

  const handleIncrease = () => {
    updateQuantity(id, quantity + 1);
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      updateQuantity(id, quantity - 1);
    } else {
      removeItem(id);
    }
  };

  const handleRemove = () => {
    removeItem(id);
  };

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col">
        {/* Cabeçalho do item */}
        <div className="mb-2 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-primary">{name}</h3>
            <p className="text-gray-600">{formatCurrency(price)}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700"
            onClick={handleRemove}
          >
            <Trash2 size={18} />
          </Button>
        </div>

        {/* Lista de Addons */}
        {addons && addons.length > 0 && (
          <div className="mb-3 ml-4">
            <p className="mb-1 text-sm text-green-700">Adicionais:</p>
            <ul className="space-y-1">
              {addons.map((addon, index) => (
                <li
                  key={`${addon.id}-${index}`}
                  className="flex justify-between text-sm text-green-700"
                >
                  <span>
                    {addon.quantity || 1}x {addon.name}
                  </span>
                  {addon.price > 0 && (
                    <span className="text-green-700">
                      +{formatCurrency(addon.price * (addon.quantity || 1))}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Controles de quantidade e preço total */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 rounded-full"
              onClick={handleDecrease}
            >
              <Minus size={16} />
            </Button>
            <span className="w-8 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 rounded-full"
              onClick={handleIncrease}
            >
              <Plus size={16} />
            </Button>
          </div>
          <div className="text-right">
            <span className="font-medium text-primary">
              {formatCurrency(getTotal())}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
