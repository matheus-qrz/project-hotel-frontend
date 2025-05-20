// stores/orderStore.ts
import { create } from 'zustand';
import { CartItemProps } from '../cart';
import { useAuthStore } from '../auth';

interface OrderMetadata {
    tableId: number;
    orderType: 'local' | 'takeaway';
    observations?: string;
    splitCount?: number;
    paymentMethod?: string;
    paymentRequestedAt?: Date;
    processedBy?: string;
}

export interface Order {
    _id: string;
    items: CartItemProps[];
    totalAmount: number;
    status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'payment_requested' | 'paid';
    isPaid: boolean;
    meta: OrderMetadata;
    guestInfo: {
        name: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateOrderData {
    items: CartItemProps[];
    totalAmount: number;
    meta: OrderMetadata;
    guestInfo?: {
        name: string;
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
    currentOrders: Order[];
    isLoading: boolean;
    error: string | null;
    stats: OrderStats | null;

    // Ações principais
    createOrder: (orderData: CreateOrderData, slug: string, tableId: string, unitId?: string) => Promise<Order>;
    fetchTableOrders: (restaurantId: string, tableId: string, unitId?: string) => Promise<void>;
    fetchOrderStats: (unitId: string) => Promise<void>;
    fetchRestaurantUnitOrders: (restaurantId: string, unitId?: string) => Promise<void>;
    requestCheckout: (tableNumber: number, splitCount?: number) => Promise<void>;
    processPayment: (orderId: string, paymentData: {
        paymentMethod: string;
        processedBy?: string;
        splitCount?: number;
    }) => Promise<void>;
    cancelOrder: (orderId: string) => Promise<void>;
    updateOrderStatus: (restaurantId: string, tableId: string, orderId: string, newStatus: 'pending' | 'processing' | 'completed' | 'cancelled' | 'payment_requested' | 'paid') => Promise<void>;

    // Cálculos
    getTableTotal: () => number;
    getAmountPerPerson: (splitCount: number) => number;
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export const useOrderStore = create<OrderStore>((set, get) => ({
    currentOrders: [],
    isLoading: false,
    error: null,
    stats: null,

    // Em orderStore.ts, na função createOrder:

    createOrder: async (orderData: CreateOrderData, restaurantId: string, tableId: string, unitId?: string) => {
        set({ isLoading: true, error: null });
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('guest_token');

            const payload = {
                ...orderData,
                status: 'pending',
                isPaid: false,
                userId: localStorage.getItem('auth_token') ? localStorage.getItem('user_id') : undefined,
                guestInfo: {
                    name: orderData.guestInfo?.name || 'Convidado'
                },
                meta: {
                    ...orderData.meta,
                    tableId: Number(tableId), // Garantir que o tableId seja incluído
                    orderType: orderData.meta.orderType || 'local',
                    splitCount: orderData.meta.splitCount || 1,
                    orderCreatedAt: new Date(),
                    isGuest: !localStorage.getItem('auth_token')
                }
            };

            console.log('Payload do pedido:', payload); // Debug


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
            console.log('Pedido criado:', newOrder); // Debug

            set(state => ({
                currentOrders: [...state.currentOrders, newOrder],
                isLoading: false
            }));

            return newOrder;
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    fetchTableOrders: async (restaurantId: string, tableId: string, unitId?: string) => {
        try {
            const endpoint = unitId ? `${API_URL}/restaurant/${unitId}/${tableId}/orders` : `${API_URL}/restaurant/${restaurantId}/${tableId}/orders`;

            const response = await fetch(endpoint, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar pedidos');
            }

            const data = await response.json();

            set({ currentOrders: data.orders });
        } catch (error) {
            console.error('Erro ao buscar pedidos:', error);
        }
    },

    fetchRestaurantUnitOrders: async (restaurantId: string, unitId?: string) => {
        const token = useAuthStore.getState().token;

        try {
            const endpoint = `${API_URL}/restaurant/${restaurantId ?? unitId}/orders`;

            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar pedidos');
            }

            const data = await response.json();

            // Atualizar o estado com os pedidos recebidos
            set({ currentOrders: data });
        } catch (error: any) {
            console.error('Erro ao buscar pedidos:', error);
            set({ error: error.message });
        }
    },

    fetchOrderStats: async (unitId: string) => {
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

    requestCheckout: async (tableNumber, splitCount = 1) => {
        set({ isLoading: true, error: null });
        try {
            const currentOrders = get().currentOrders;
            const orderIds = currentOrders.map(order => order._id);

            const response = await fetch(`${API_URL}/order/request-checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderIds,
                    tableNumber,
                    splitCount
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao solicitar fechamento');
            }

            set(state => ({
                currentOrders: state.currentOrders.map(order => ({
                    ...order,
                    status: 'payment_requested',
                    meta: {
                        ...order.meta,
                        splitCount,
                        paymentRequestedAt: new Date()
                    }
                })),
                isLoading: false
            }));
        } catch (error: any) {
            set({
                error: error.message,
                isLoading: false
            });
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
                    splitCount: paymentData.splitCount
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao processar pagamento');
            }

            set(state => ({
                currentOrders: state.currentOrders.map(order =>
                    order._id === orderId
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
            set({
                error: error.message,
                isLoading: false
            });
            throw error;
        }
    },

    cancelOrder: async (orderId: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/order/${orderId}/update`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'cancelled',
                    meta: {
                        ...get().currentOrders.find(order => order._id === orderId)?.meta,
                        cancelledAt: new Date()
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao cancelar pedido');
            }

            set(state => ({
                currentOrders: state.currentOrders.filter(order => order._id !== orderId),
                isLoading: false
            }));
        } catch (error: any) {
            set({
                error: error.message,
                isLoading: false
            });
            throw error;
        }
    },

    updateOrderStatus: async (
        restaurantId: string,
        tableId: string,
        orderId: string,
        newStatus: 'pending' | 'processing' | 'completed' | 'cancelled' | 'payment_requested' | 'paid'
    ) => {
        set(state => ({ ...state, isLoading: true, error: null }));
        const token = useAuthStore.getState().token;
        try {
            const response = await fetch(`${API_URL}/restaurant/${restaurantId}/${tableId}/order/${orderId}/update`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar status do pedido');
            }

            // Atualizar o estado local com o novo status
            set(state => ({
                ...state,
                currentOrders: state.currentOrders.map(order =>
                    order._id === orderId
                        ? { ...order, status: newStatus }
                        : order
                ),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    getTableTotal: () => {
        return get().currentOrders.reduce((total, order) =>
            total + order.totalAmount, 0
        );
    },

    getAmountPerPerson: (splitCount: number) => {
        const total = get().getTableTotal();
        return total / (splitCount || 1);
    }
}));