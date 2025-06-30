import { CartItemProps } from "@/stores";
import { OrderItemStatusType } from "@/stores/order/types/order.types";

export interface OrderMetadata {
    tableId: number;
    guestId: string;
    orderType: 'local' | 'takeaway';
    observations?: string;
    splitCount?: number;
    paymentMethod?: string;
    paymentRequestedAt?: Date;
    processedBy?: string;
    orderCreatedAt: Date;
}

// Interface para métricas financeiras (opcional para clientes)
export interface FinancialMetrics {
    costPrice?: number;
    profit?: number;
    promotionalDiscount?: number;
}

export interface OrderItem extends CartItemProps {
    itemStatus?: OrderItemStatusType; // Status do item no pedido
}

// Interface base do Order
export interface Order {
    _id: string;
    items: OrderItem[];
    totalAmount: number;
    status: 'processing' | 'completed' | 'cancelled' | 'payment_requested' | 'paid';
    isPaid: boolean;
    meta: OrderMetadata;
    guestInfo: {
        id: string;
        name: string;
        joinedAt: string;
    };
    createdAt: Date;
    updatedAt: Date;
    financialMetrics?: FinancialMetrics; // Opcional para clientes
}

// Interface para criação de pedido (mantém a estrutura original)
export interface CreateOrderData {
    items: CartItemProps[];
    totalAmount: number;
    meta: OrderMetadata;
    guestInfo: {
        id: string;
        name: string;
        joinedAt: string;
    };
}

export interface OrderStats {
    inProgress: number;
    approved: {
        count: number;
        change: number;
    };
    cancelled: {
        count: number;
        change: number;
    };
    topSelling: string;
    mostOrdered: Array<{
        name: string;
        orders: number;
    }>;
}