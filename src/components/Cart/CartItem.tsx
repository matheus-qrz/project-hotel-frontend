// components/cart/CartItem.tsx
import { useEffect } from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusTexts, StatusColors, OrderStatus } from "@/components/cart/constants";
import { useCartStore } from "@/stores";

export interface CartItemProps {
    id: string;
    name: string;
    price: number;
    quantity: number;
    status: OrderStatus;
    image: string;
    guestId: string;
}

export default function CartItem({
    id,
    name,
    image,
    price,
    quantity,
    status,
    guestId
}: CartItemProps) {
    const { updateQuantity, removeItem, updateItemStatus } = useCartStore();

    const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(price);

    const formattedTotal = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(price * quantity);

    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity === 0) {
            removeItem(id);
        } else {
            updateQuantity(id, newQuantity);
        }
    };

    const isEditable = status === 'pending';

    return (
        <div className="border-b border-border py-4">
            <div className="flex gap-4">
                <div className="w-20 h-20 rounded-md overflow-hidden">
                    <img
                        src={image}
                        alt={name}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-primary font-medium">{formattedTotal}</span>
                            <div className="text-gray-500 text-sm mt-1">
                                {formattedPrice} cada
                            </div>
                        </div>
                        {status !== 'pending' && (
                            <span
                                className={`text-sm px-2 py-1 rounded-full ${StatusColors[status]}`}
                            >
                                {StatusTexts[status]}
                            </span>
                        )}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full border border-border"
                                onClick={() => handleQuantityChange(quantity - 1)}
                                disabled={!isEditable}
                            >
                                <Minus size={16} />
                            </Button>
                            <span className="mx-2 text-primary">{quantity}</span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full border border-border"
                                onClick={() => handleQuantityChange(quantity + 1)}
                                disabled={!isEditable}
                            >
                                <Plus size={16} />
                            </Button>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
                            onClick={() => removeItem(id)}
                            disabled={!isEditable}
                        >
                            <Trash2 size={16} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}