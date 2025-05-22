// stores/orderStore.ts
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
    updateOrderStatus: (restaurantId: string, tableId: string, orderId: string, newStatus: Order['status']) => Promise<void>;
    getTableTotal: (guestId?: string) => number;
    getAmountPerPerson: (splitCount: number, guestId?: string) => number;
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export const useOrderStore = create(
    persist<OrderStore>(
        (set, get) => ({
            order: [],
            setOrders: (orders) => set({ order: orders }),
            isLoading: false,
            error: null,
            stats: null,

            createOrder: async (orderData: CreateOrderData, restaurantId: string, tableId: string, unitId?: string) => {
                set({ isLoading: true, error: null });
                try {
                    const token = localStorage.getItem('auth_token') || localStorage.getItem('guest_token');

                    const payload = {
                        ...orderData,
                        status: 'pending',
                        isPaid: false,
                        restaurantId: unitId ? undefined : restaurantId, // Adiciona restaurantId se não houver unitId
                        restaurantUnitId: unitId, // Adiciona unitId se existir
                        meta: {
                            ...orderData.meta,
                            tableId: Number(tableId),
                            guestId: orderData.guestInfo.id,
                            orderCreatedAt: new Date()
                        }
                    };

                    const endpoint = unitId
                        ? `${API_URL}/restaurant/${unitId}/${tableId}/order/new`
                        : `${API_URL}/restaurant/${restaurantId}/${tableId}/order/new`;

                    const response = await fetch(endpoint, {
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

            fetchTableOrders: async (restaurantId, tableId, guestId) => {
                try {
                    const response = await fetch(`${API_URL}/restaurant/${restaurantId}/${tableId}/orders?guestId=${guestId}`);
                    console.log("URL chamada:", response.url);

                    if (!response.ok) throw new Error('Erro ao buscar pedidos');

                    const data = await response.json();
                    console.log("Dados recebidos:", data);

                    set(state => ({
                        ...state,
                        order: data.orders || []
                    }));
                } catch (error) {
                    console.error('Erro ao buscar pedidos:', error);
                    throw error;
                }
            },

            fetchRestaurantUnitOrders: async (restaurantId, unitId) => {
                const token = useAuthStore.getState().token;
                try {
                    const endpoint = `${API_URL}/restaurant/${restaurantId ?? unitId}/orders`;

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

            updateOrderStatus: async (restaurantId, tableId, orderId, newStatus) => {
                set({ isLoading: true, error: null });
                const token = useAuthStore.getState().token;
                try {
                    const response = await fetch(
                        `${API_URL}/restaurant/${restaurantId}/${tableId}/order/${orderId}/update`,
                        {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ status: newStatus })
                        }
                    );

                    if (!response.ok) throw new Error('Erro ao atualizar status do pedido');

                    set(state => ({
                        order: state.order.map(order =>
                            order._id === orderId ? { ...order, status: newStatus } : order
                        ),
                        isLoading: false
                    }));
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
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
        }),
        {
            name: 'order-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state: OrderStore) => ({
                order: state.order,
            }) as OrderStore,
        }
    ));

