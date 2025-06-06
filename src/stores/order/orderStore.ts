import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CartItemProps } from '../cart';
import { useAuthStore } from '../auth';

interface OrderMetadata {
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

export interface Order {
    _id: string;
    items: CartItemProps[];
    totalAmount: number;
    status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'payment_requested' | 'paid';
    isPaid: boolean;
    meta: OrderMetadata;
    guestInfo: {
        id: string;
        name: string;
        joinedAt: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

interface CreateOrderData {
    items: CartItemProps[];
    totalAmount: number;
    meta: OrderMetadata;
    guestInfo: {
        id: string;
        name: string;
        joinedAt: string;
    };
}

interface OrderStats {
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
    requestCheckout: (tableId: string, restaurantId: string, guestId: string, splitCount?: number) => Promise<void>;
    processPayment: (orderId: string, paymentData: {
        paymentMethod: string;
        processedBy?: string;
        splitCount?: number;
        guestId: string;
    }) => Promise<void>;
    cancelOrder: (orderId: string, restaurantId: string, tableId: string) => Promise<void>;
    cancelOrderItem: (orderId: string, itemId: string, restaurantId: string, tableId: string) => Promise<void>;
    updateOrder: (restaurantId: string, tableId: string, orderId: string, updatedData: Partial<Order>) => Promise<void>;
    getTableTotal: (guestId?: string) => number;
    getAmountPerPerson: (splitCount: number, guestId?: string) => number;
    deleteOldOrders: () => void;  // Função para limpar pedidos antigos
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export const useOrderStore = create(
    persist<OrderStore>(
        (set, get) => ({
            order: [],
            isLoading: false,
            error: null,
            stats: null,

            setOrders: (orders) => set({ order: orders }),

            createOrder: async (orderData: CreateOrderData, restaurantId: string, tableId: string, unitId?: string) => {
                set({ isLoading: true, error: null });
                try {
                    const token = localStorage.getItem('auth_token') || localStorage.getItem('guest_token');
                    const establishmentId = restaurantId || unitId;

                    const payload = {
                        ...orderData,
                        status: 'pending',
                        isPaid: false,
                        restaurantId: unitId ? undefined : restaurantId,
                        restaurantUnitId: unitId,
                        meta: {
                            ...orderData.meta,
                            tableId: Number(tableId),
                            guestId: orderData.guestInfo.id,
                            orderCreatedAt: new Date()
                        },
                    };

                    const response = await fetch(`${API_URL}/restaurant/${establishmentId}/${tableId}/order/new`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token ? `Bearer ${token}` : ''
                        },
                        body: JSON.stringify(payload)
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Erro ao criar pedido');
                    }

                    const newOrder = await response.json();
                    set(state => ({
                        order: [...state.order, newOrder],
                        isLoading: false
                    }));

                    return newOrder;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            fetchTableOrders: async (restaurantId: string, tableId: string, guestId: string) => {
                try {
                    const response = await fetch(`${API_URL}/restaurant/${restaurantId}/${tableId}/orders?guestId=${guestId}`);
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
                    const response = await fetch(`${API_URL}/${tableId}/guest-orders/${guestId}`);
                    if (!response.ok) throw new Error('Erro ao buscar pedidos do convidado');

                    const data = await response.json();
                    set({ order: data.orders || [] });
                } catch (error) {
                    console.error('Erro ao buscar pedidos do convidado:', error);
                    throw error;
                }
            },

            fetchRestaurantUnitOrders: async (restaurantId, unitId) => {
                const token = useAuthStore.getState().token;
                try {
                    if (!unitId && !restaurantId) {
                        throw new Error("ID da unidade ou do restaurante é obrigatório.");
                    }

                    const endpoint = unitId
                        ? `${API_URL}/restaurant-unit/${unitId}/orders`
                        : `${API_URL}/restaurant/${restaurantId}/orders`;

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
                    const response = await fetch(`${API_URL}/unit/${unitId}/orders/stats`);
                    if (!response.ok) throw new Error('Erro ao buscar estatísticas');

                    const data = await response.json();
                    set({ stats: data, isLoading: false });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            requestCheckout: async (tableId, restaurantId, guestId, splitCount = 1) => {
                set({ isLoading: true, error: null });
                try {
                    const order = get().order.filter(
                        order => order.guestInfo.id === guestId
                    );

                    const orderIds = order.map(order => order._id);

                    const response = await fetch(`${API_URL}/restaurant/${restaurantId}/${tableId}/order/request-checkout`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            orderIds,
                            tableId,
                            guestId,
                            splitCount
                        })
                    });

                    if (!response.ok) throw new Error('Erro ao solicitar fechamento');

                    set(state => ({
                        order: state.order.map(order =>
                            order.guestInfo.id === guestId
                                ? {
                                    ...order,
                                    status: 'payment_requested',
                                    meta: {
                                        ...order.meta,
                                        splitCount,
                                        paymentRequestedAt: new Date()
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

            processPayment: async (orderId, paymentData) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`${API_URL}/order/${orderId}/process-payment`, {
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

            updateOrder: async (restaurantId, tableId, orderId, updatedData) => {
                try {
                    const response = await fetch(`${API_URL}/restaurant/${restaurantId}/${tableId}/order/${orderId}/update`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(updatedData),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Erro ao atualizar pedido');
                    }

                    const updatedOrder = await response.json();

                    // Atualiza o estado local
                    set((state: OrderStore) => ({
                        order: state.order.map((order: Order) =>
                            order._id === updatedOrder._id ? updatedOrder : order
                        ),
                    }));
                } catch (error) {
                    console.error("Erro ao atualizar pedido:", error);
                    // Aqui você pode lidar com erros, por exemplo, definir um estado de erro
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

            partialize: (state: OrderStore) => ({
                order: state.order.map(order => ({
                    _id: order._id,
                    totalAmount: order.totalAmount,
                    status: order.status,
                })),
                isLoading: false,
                error: null,
                stats: null,
            }),
        }),
        {
            name: 'order-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
