import { CartItemProps } from "../cart";

// types/order.ts
export interface OrderItem extends CartItemProps {
    status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'payment_requested' | 'paid';
}

export interface Order {
    _id: string;
    items: OrderItem[];
    status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'payment_requested' | 'paid';
    createdAt: string;
    totalAmount: number;
    meta: {
        tableId: number;
        observations?: string;
        orderType: 'local' | 'takeaway';
    };
}