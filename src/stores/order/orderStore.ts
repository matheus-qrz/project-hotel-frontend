import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CartItemProps } from '../cart';
import { useAuthStore } from '../auth';
import { OrderItemStatus, OrderItemStatusType, OrderStatus, OrderStatusType, OrderType } from './types/order.types';

export interface OrderMetadata {
    tableId: number;
    guestId: string;
    orderType: OrderType;
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
    itemStatus?: OrderItemStatusType;
    createdAt?: Date;
    _id: string;
}

// Interface base do Order
export interface Order {
    _id: string;
    items: OrderItem[];
    totalAmount: number;
    status: OrderStatusType;
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

interface OrderStore {
    order: Order[];
    isLoading: boolean;
    error: string | null;
    stats: OrderStats | null;

    setOrders: (orders: Order[]) => void;
    createOrder: (orderData: CreateOrderData, restaurantId: string, tableId: string, unitId?: string) => Promise<Order>;
    fetchGuestOrders: (guestId: string, tableId: string) => Promise<void>;
    fetchTableOrders: (restaurantId: string, tableId: string, guestId: string) => Promise<void>;
    fetchOrderStats: (unitId: string) => Promise<void>;
    fetchRestaurantUnitOrders: (restaurantId: string, unitId?: string) => Promise<void>;
    requestCheckout: (orderIds: string[], guestId: string, restaurantId: string, tableId: string, splitCount?: number) => Promise<void>;
    processPayment: (orderId: string, paymentData: {
        paymentMethod: string;
        processedBy?: string;
        splitCount?: number;
        guestId: string;
    }) => Promise<void>;
    cancelOrder: (orderId: string, restaurantId: string, tableId: string) => Promise<void>;
    cancelOrderItem: (orderId: string, itemId: string, restaurantId: string, tableId: string) => Promise<void>;
    addItemsToOrder: (restaurantId: string, tableId: string, orderId: string, guestId: string, items: CartItemProps[], totalAmount: number) => Promise<void>;
    updateOrderItem: (
        restaurantId: string,
        tableId: string,
        orderId: string,
        itemId: string,
        updates: {
            quantity?: number;
            observations?: string;
        }
    ) => Promise<void>;
    updateOrder: (restaurantId: string, tableId: string, orderId: string, updatedData: Partial<Order>) => Promise<void>;
    getTableTotal: (guestId?: string) => number;
    getAmountPerPerson: (splitCount: number, guestId?: string) => number;
    deleteOldOrders: () => void;
    cleanUpOrders: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const token = useAuthStore.getState().token

const customStorage = {
    getItem: async (name: string) => {
        try {
            // Pega apenas pedidos ativos (não pagos e não cancelados)
            const value = sessionStorage.getItem(name);
            if (!value) return null;

            const data = JSON.parse(value);
            const activeOrders = data.state.order.filter((order: Order) =>
                !order.isPaid &&
                order.status !== OrderStatus.CANCELLED &&
                order.status !== OrderStatus.COMPLETED
            );

            return JSON.stringify({
                ...data,
                state: { ...data.state, order: activeOrders }
            });
        } catch (error) {
            console.warn('Erro ao ler storage:', error);
            return null;
        }
    },

    setItem: async (name: string, value: string) => {
        try {
            // Armazena apenas dados essenciais dos pedidos ativos
            const data = JSON.parse(value);
            const activeOrders = data.state.order.filter((order: Order) =>
                !order.isPaid &&
                order.status !== OrderStatus.CANCELLED &&
                order.status !== OrderStatus.COMPLETED
            ).map((order: Order) => ({
                _id: order._id,
                items: order.items,
                totalAmount: order.totalAmount,
                status: order.status,
                isPaid: order.isPaid,
                meta: {
                    tableId: order.meta.tableId,
                    guestId: order.meta.guestId,
                    orderType: order.meta.orderType,
                    orderCreatedAt: order.meta.orderCreatedAt
                },
                guestInfo: {
                    id: order.guestInfo.id,
                    name: order.guestInfo.name
                }
            }));

            sessionStorage.setItem(name, JSON.stringify({
                ...data,
                state: { ...data.state, order: activeOrders }
            }));
        } catch (error) {
            console.warn('Erro ao salvar no storage:', error);
        }
    },

    removeItem: async (name: string) => {
        try {
            sessionStorage.removeItem(name);
        } catch (error) {
            console.warn('Erro ao remover do storage:', error);
        }
    }
};

export const useOrderStore = create(
    persist<OrderStore>(
        (set, get) => ({
            order: [],
            isLoading: false,
            error: null,
            stats: null,


            setOrders: (orders) => {
                const activeOrders = orders.filter(order =>
                    !order.isPaid &&
                    order.status !== OrderStatus.CANCELLED)
                    .sort((a, b) => new Date(b.createdAt)
                        .getTime() - new Date(a.createdAt)
                            .getTime());

                set({ order: activeOrders });
            },

            cleanCompletedOrders: () => {
                set(state => ({
                    order: state.order.filter(order =>
                        order.status !== OrderStatus.CANCELLED &&
                        order.status !== OrderStatus.COMPLETED &&
                        !order.isPaid
                    )
                }));
            },

            createOrder: async (orderData: CreateOrderData, restaurantId: string, tableId: string, unitId?: string) => {
                set({ isLoading: true, error: null });
                try {
                    const payload = {
                        ...orderData,
                        status: OrderStatus.PROCESSING,
                        isPaid: false,
                        items: orderData.items.map(item => ({
                            ...item,
                            status: OrderItemStatus.ADDED
                        })),
                        restaurantUnitId: unitId || restaurantId,
                        meta: {
                            ...orderData.meta,
                            tableId: Number(tableId),
                            guestId: orderData.guestInfo.id,
                            orderCreatedAt: new Date()
                        }
                    };

                    const response = await fetch(`/api/restaurant/${restaurantId}/${tableId}/order/new`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(payload)
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Erro ao criar pedido');
                    }

                    const newOrder = await response.json();
                    set(state => ({ order: [newOrder, ...state.order].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), isLoading: false }));

                    return newOrder;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            fetchTableOrders: async (restaurantId: string, tableId: string, guestId: string) => {
                try {
                    const response = await fetch(`/api/restaurant/${restaurantId}/${tableId}/orders?guestId=${guestId}`);
                    if (!response.ok) throw new Error('Erro ao buscar pedidos');

                    const data = await response.json();
                    set(state => ({
                        order: data.orders || []
                    }));
                } catch (error) {
                    console.error('Erro ao buscar pedidos:', error);
                    throw error;
                }
            },

            fetchGuestOrders: async (guestId: string, tableId: string) => {
                try {
                    const response = await fetch(`/api/${tableId}/guest-orders/${guestId}`);
                    if (!response.ok) throw new Error('Erro ao buscar pedidos do convidado');

                    const data = await response.json();
                    interface GuestOrderResponse {
                        orders: Order[];
                    }

                    const activeOrders: Order[] = ((data as GuestOrderResponse).orders || [])
                        .filter((order: Order) => !order.isPaid && order.status !== 'cancelled')
                        .sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    set({ order: activeOrders });
                } catch (error) {
                    console.error('Erro ao buscar pedidos do convidado:', error);
                    throw error;
                }
            },

            fetchRestaurantUnitOrders: async (restaurantId, unitId) => {
                try {
                    if (!unitId && !restaurantId) {
                        throw new Error("ID da unidade ou do restaurante é obrigatório.");
                    }

                    const endpoint = unitId
                        ? `/api/restaurant/${unitId}/orders`
                        : `/api/restaurant/${restaurantId}/orders`;

                    const response = await fetch(endpoint, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!response.ok) throw new Error('Erro ao buscar pedidos');

                    const data = await response.json();
                    set({ order: data });
                } catch (error: any) {
                    console.error('Erro ao buscar pedidos:', error);
                    set({ error: error.message });
                }
            },

            fetchOrderStats: async (unitId) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/unit/${unitId}/orders/stats`);
                    if (!response.ok) throw new Error('Erro ao buscar estatísticas');

                    const data = await response.json();
                    set({ stats: data, isLoading: false });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            fetchOrdersWithMetrics: async (unitId: string) => {
                try {
                    const response = await fetch(`/api/restaurant-unit/${unitId}/orders/metrics`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!response.ok) throw new Error('Erro ao buscar pedidos com métricas');

                    const data = await response.json();
                    return data;
                } catch (error: any) {
                    console.error('Erro ao buscar pedidos com métricas:', error);
                    throw error;
                }
            },



            requestCheckout: async (orderIds: string[], guestId: string, restaurantId: string, tableId: string, splitCount?: number) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/restaurant/${restaurantId}/${tableId}/order/request-checkout`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            orderIds,
                            guestId,
                            splitCount
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message);
                    }

                    const updatedOrders = await response.json();

                    set(state => ({
                        order: state.order.map(order =>
                            updatedOrders.find((updated: Order) => updated._id === order._id) || order
                        ),
                        isLoading: false
                    }));
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            processPayment: async (orderId, paymentData) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/order/${orderId}/process-payment`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            paymentMethod: paymentData.paymentMethod,
                            processedBy: paymentData.processedBy,
                            splitCount: paymentData.splitCount,
                            guestId: paymentData.guestId
                        })
                    });

                    if (!response.ok) throw new Error('Erro ao processar pagamento');

                    set(state => ({
                        order: state.order.map(order =>
                            order._id === orderId && order.guestInfo.id === paymentData.guestId
                                ? {
                                    ...order,
                                    status: 'completed',
                                    isPaid: true,
                                    meta: {
                                        ...order.meta,
                                        paymentMethod: paymentData.paymentMethod,
                                        processedBy: paymentData.processedBy,
                                        splitCount: paymentData.splitCount
                                    }
                                }
                                : order
                        ),
                        isLoading: false
                    }));
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            cancelOrder: async (orderId: string, restaurantId: string, tableId: string) => {
                try {
                    const response = await fetch(`/api/restaurant/${restaurantId}/${tableId}/order/${orderId}/cancel`, {
                        method: 'PATCH'
                    });

                    if (!response.ok) throw new Error('Falha ao cancelar pedido');

                    return await response.json();
                } catch (error) {
                    console.error('Erro ao cancelar pedido:', error);
                    throw error;
                }
            },

            cancelOrderItem: async (orderId: string, itemId: string, restaurantId: string, tableId: string) => {
                try {
                    const response = await fetch(`/api/restaurant/${restaurantId}/${tableId}/order/${orderId}/item/${itemId}/cancel`, {
                        method: 'PATCH'
                    });

                    if (!response.ok) throw new Error('Falha ao cancelar item');

                    return await response.json();
                } catch (error) {
                    console.error('Erro ao cancelar item:', error);
                    throw error;
                }
            },

            updateOrder: async (restaurantId: string, tableId: string, orderId: string, updatedData: Partial<Order>) => {
                try {
                    const response = await fetch(`/api/restaurant/${restaurantId}/${tableId}/order/${orderId}/update`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(updatedData),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Erro ao atualizar pedido');
                    }

                    const updatedOrder = await response.json();

                    set((state) => ({
                        order: state.order.map((order: Order) => {
                            if (order._id === orderId) {
                                switch (updatedData.status) {
                                    case OrderStatus.COMPLETED:
                                        return {
                                            ...order,
                                            ...updatedData,
                                            items: order.items.map(item => ({
                                                ...item,
                                                itemStatus: OrderItemStatus.COMPLETED
                                            }))
                                        };
                                    case OrderStatus.PROCESSING:
                                        return {
                                            ...order,
                                            ...updatedData,
                                            items: order.items.map(item => ({
                                                ...item,
                                                itemStatus: item.itemStatus === OrderItemStatus.COMPLETED
                                                    ? OrderItemStatus.COMPLETED
                                                    : OrderItemStatus.ADDED
                                            }))
                                        };
                                    case OrderStatus.CANCELLED:
                                        return {
                                            ...order,
                                            ...updatedData,
                                            items: order.items.map(item => ({
                                                ...item,
                                                itemStatus: OrderItemStatus.CANCELLED
                                            }))
                                        };
                                    default:
                                        return { ...order, ...updatedData };
                                }
                            }
                            return order;
                        }),
                    }));

                    return updatedOrder;
                } catch (error) {
                    console.error("Erro ao atualizar pedido:", error);
                    throw error;
                }
            },

            addItemsToOrder: async (restaurantId: string, tableId: string, orderId: string, guestId: string, items: CartItemProps[], totalAmount: number) => {
                try {
                    const itemsWithStatus = items.map(item => ({
                        ...item,
                        status: OrderItemStatus.ADDED
                    }));

                    const response = await fetch(`/api/restaurant/${restaurantId}/${tableId}/order/${orderId}/guest/${guestId}/add-items`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            items: itemsWithStatus,
                            totalAmount
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Falha ao adicionar itens ao pedido');
                    }

                    const updatedOrder = await response.json();

                    // Atualiza o estado local
                    set((state) => ({
                        order: state.order.map((order) =>
                            order._id === updatedOrder._id ? updatedOrder : order
                        )
                    }));

                    return updatedOrder;
                } catch (error) {
                    console.error("Erro ao adicionar itens ao pedido:", error);
                    throw error;
                }
            },

            // No orderStore, adicione esta função junto com as outras

            updateOrderItem: async (restaurantId: string,
                tableId: string,
                orderId: string,
                itemId: string,
                updates: {
                    quantity?: number;
                    observations?: string
                    status?: OrderItemStatusType;
                }) => {
                try {
                    const updatesWithStatus = {
                        ...updates,
                        status: updates.quantity !== undefined
                            ? OrderItemStatus.ADDED
                            : updates.status
                    };

                    const response = await fetch(`/api/restaurant/${restaurantId}/${tableId}/order/${orderId}/item/${itemId}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(updatesWithStatus)
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Erro ao atualizar item do pedido');
                    }

                    const updatedOrder = await response.json();

                    // Atualiza o estado local
                    set((state) => ({
                        order: state.order.map((order) =>
                            order._id === orderId ? updatedOrder : order
                        )
                    }));

                    return updatedOrder;
                } catch (error) {
                    console.error("Erro ao atualizar item do pedido:", error);
                    throw error;
                }
            },

            getTableTotal: (guestId?) => {
                const state = get();
                const relevantOrders = guestId
                    ? state.order.filter(order => order.guestInfo.id === guestId)
                    : state.order;

                return relevantOrders.reduce((total, order) => total + order.totalAmount, 0);
            },

            getAmountPerPerson: (splitCount, guestId?) => {
                const total = get().getTableTotal(guestId);
                return total / (splitCount || 1);
            },

            deleteOldOrders: () => {
                const newOrders = get().order.filter(order => {
                    const createdAt = new Date(order.createdAt);
                    const now = new Date();
                    const diffInDays = (now.getTime() - createdAt.getTime()) / (1000 * 3600 * 24);
                    return diffInDays < 30; // Mantém apenas pedidos dos últimos 30 dias
                });
                set({ order: newOrders });
            },

            cleanUpOrders: () => {
                set(state => ({
                    order: state.order.filter(order =>
                        !order.isPaid &&
                        order.status !== 'cancelled' &&
                        order.status !== 'completed')
                }));
            },
        }),
        {
            name: 'order-storage',
            storage: createJSONStorage(() => customStorage),
            partialize: (state) => ({
                ...state,
                order: state.order.filter(order =>
                    order.status !== 'completed' &&
                    order.status !== 'cancelled' &&
                    !order.isPaid
                )
            }),
        }
    )
);

