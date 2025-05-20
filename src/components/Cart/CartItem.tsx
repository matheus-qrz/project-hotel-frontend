import { useEffect } from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusTexts, StatusColors, OrderStatus } from "@/components/cart/constants";

export interface CartItemProps {
    id: string;
    name: string;
    imageUrl: string;
    price: number;
    quantity: number;
    status: OrderStatus;
    onQuantityChange: (id: string, quantity: number) => void;
    onRemove: (id: string) => void;
}

export default function CartItem({
    id,
    name,
    imageUrl,
    price,
    quantity,
    status,
    onQuantityChange,
    onRemove
}: CartItemProps) {
    const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(price);

    const formattedTotal = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(price * quantity);

    useEffect(() => {
        console.log(`CartItem ${id} status atualizado:`, {
            name,
            status,
            statusText: StatusTexts[status],
            statusColor: StatusColors[status]
        });
    }, [id, name, status]);

    return (
        <div className="border-b border-border py-4">
            <div className="flex gap-4">
                <div className="w-20 h-20 rounded-md overflow-hidden">
                    <img
                        src={imageUrl}
                        alt={name}
                        style={{ objectFit: 'cover' }}
                    />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between">
                        <div>
                            <h3 className="font-medium text-primary">{name}</h3>
                            <span
                                className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${StatusColors[status] || 'bg-gray-100 text-gray-800'}`}
                            >
                                {StatusTexts[status] || `Status: ${status}`}
                            </span>
                        </div>
                        <span className="text-primary font-medium">{formattedTotal}</span>
                    </div>
                    <div className="text-gray-500 text-sm mt-1">
                        {formattedPrice} cada
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full border border-border"
                                onClick={() => onQuantityChange(id, quantity - 1)}
                                disabled={status !== 'pending'}
                            >
                                <Minus size={16} />
                            </Button>
                            <span className="mx-2 text-primary">{quantity}</span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full border border-border"
                                onClick={() => onQuantityChange(id, quantity + 1)}
                                disabled={status !== 'pending'}
                            >
                                <Plus size={16} />
                            </Button>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
                            onClick={() => onRemove(id)}
                            disabled={status !== 'pending'}
                        >
                            <Trash2 size={16} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}