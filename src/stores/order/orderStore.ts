import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CartItemProps } from '../cart';
import { useAuthStore } from '../auth';
import { OrderItemStatus, OrderItemStatusType, OrderStatus, OrderStatusType, OrderType } from './types/order.types';
import { useTableStore } from './tableStore';
import { getOrCreateOrderSessionId } from '@/utils/session';

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

export interface Order {
    _id: string;
    items: OrderItem[];
    observations?: string;
    totalAmount: number;
    status: OrderStatusType;
    isPaid: boolean;
    meta: OrderMetadata;
    guestInfo: {
        id: string;
        name: string;
        joinedAt: string;
    };
    sessionId: string;
    createdAt: Date;
    updatedAt: Date;
    financialMetrics?: FinancialMetrics;
}

export interface CreateOrderData {
    items: CartItemProps[];
    totalAmount: number;
    meta: OrderMetadata;
    guestInfo: {
        id: string;
        name: string;
        joinedAt: string;
    };
    sessionId?: string;
    orderId?: string; // ✅ Novo campo para reaproveitar pedido existente
}

interface OrderStore {
    order: Order[];
    isLoading: boolean;
    error: string | null;
    sessionId: string | null;
    currentOrderId: string | null;
    stats: OrderStatusType | null;
    previousOrders: Order[];

    setSessionId: (id: string) => void;
    getSessionId: () => void;
    setOrders: (orders: Order[]) => void;
    setPreviousOrders: (orders: Order[]) => void;
    setCurrentOrderId: (id: string) => void;

    fetchGuestOrders: (guestId: string, tableId: number) => Promise<Order[]>;
    fetchRestaurantUnitOrders: (restaurantId: string, unitId?: string) => Promise<void>;
    fetchOrderStats: (unitId: string) => Promise<void>;
    requestCheckout: (orderId: string, guestId: string, restaurantId: string, tableId: number, splitCount?: number) => Promise<void>;
    processPayment: (orderId: string, paymentData: {
        paymentMethod: string;
        processedBy?: string;
        splitCount?: number;
        guestId: string;
    }) => Promise<void>;
    cancelOrder: (orderId: string, restaurantId: string, tableId: number) => Promise<void>;
    cancelOrderItem: (orderId: string, itemId: string, restaurantId: string, tableId: number, guestId?: string) => Promise<void>;
    updateOrderItem: (restaurantId: string, tableId: number, orderId: string, itemId: string, updates: {
        quantity?: number;
        observations?: string;
        status?: OrderItemStatusType;
    }) => Promise<void>;
    getTableTotal: (guestId?: string) => number;
    getAmountPerPerson: (splitCount: number, guestId?: string) => number;
    deleteOldOrders: () => void;
    cleanUpOrders: () => void;

    // 🚀 Novo fluxo unificado
    submitOrderUnified: (params: {
        items: CartItemProps[];
        totalAmount: number;
        guestInfo: {
            id: string;
            name: string;
            joinedAt: string;
        };
        meta: OrderMetadata;
        restaurantId: string;
        restaurantUnitId?: string;
        sessionId?: string;
        orderId?: string;
    }) => Promise<Order>;
    updateOrderStatus: (restaurantId: string, orderId: string, status: OrderStatusType) => Promise<void>;
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const token = useAuthStore.getState().token;
const sessionId = getOrCreateOrderSessionId();

function sortOrdersDesc(a: Order, b: Order) {
  const au = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
  const bu = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
  return bu - au; 
}

function mergeOrders(prev: Order[], incoming: Order[]) {
  const byId = new Map<string, Order>();
  // antigos primeiro…
  for (const o of prev) byId.set(String(o._id), o);
  // …novos por cima (substituem versões antigas)
  for (const o of incoming) byId.set(String(o._id), o);
  return Array.from(byId.values()).sort(sortOrdersDesc);
}

function upsertOne(prev: Order[], next: Order) {
  return mergeOrders(prev, [next]);
}

const customStorage = {
    getItem: async (name: string) => {
        try {
            if (typeof window === "undefined") return null;

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
            sessionId: null,
            currentOrderId: null,
            previousOrders: [],
            isLoading: false,
            stats: null,
            error: null,

            setOrders: (order: Order[]) => set({ order }),
            setSessionId: (id: string) => set({ sessionId: id }),
            setCurrentOrderId: (id: string) => set({ currentOrderId: id }),

            getSessionId: () => get().sessionId,

            setPreviousOrders: (orders) => set({ previousOrders: orders }),


            getOrderByGuestId: (guestId: string, tableId?: number) => {
                return get().order.find(order =>
                    order.guestInfo.id === guestId &&
                    order.meta.tableId === tableId && // ← importante
                    !order.isPaid &&
                    ['processing', 'payment_requested'].includes(order.status)
                ) || null;
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

            submitOrderUnified: async ({
                restaurantId,
                restaurantUnitId,
                items,
                guestInfo,
                meta,
                totalAmount
            }) => {
                try {
                    const response = await fetch(`${API_URL}/restaurant/${restaurantId}/order/initiate`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                            'x-session-id': sessionId,  
                        },
                        body: JSON.stringify({
                            _id: get().currentOrderId,
                            restaurantId,
                            restaurantUnitId: restaurantUnitId ?? restaurantId,
                            guestInfo,
                            meta,
                            items,
                            totalAmount,
                        }),
                    });


                    if (!response.ok) {
                        const err = await response.json().catch(() => ({}));
                        throw new Error(err?.message || 'Erro ao enviar pedido');
                    }

                    const order = await response.json();

                    get().setSessionId(order.sessionId);
                    get().setCurrentOrderId(order._id);

                    const updatedOrders = [
                        ...get().order.filter(
                            (o) => o.meta.guestId !== guestInfo.id || o.meta.tableId !== meta.tableId
                        ),
                        order
                    ];

                    get().setOrders(updatedOrders);

                    return order;
                } catch (err) {
                    console.error("Erro no submitOrderUnified:", err);
                    return null;
                }
            },

            fetchTableOrders: async (restaurantId: string, tableId: number, guestId: string) => {
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

            fetchGuestOrders: async (guestId: string, tableId: number) => {
                try {
                    const restaurantId = useTableStore.getState().restaurantId;

                    if (!restaurantId) throw new Error('restaurantId não definido no tableStore');
                    const sessionId = get().sessionId;

                    const response = await fetch(
                        `${API_URL}/restaurant/${restaurantId}/${tableId}/guest/${guestId}/orders`,
                        {
                            headers: {
                                'x-session-id': sessionId ?? ''
                            }
                        }
                    );

                    if (!response.ok) throw new Error('Erro ao buscar pedidos');

                    const data = await response.json();

                    const orders = Array.isArray(data) ? data : [];

                    set((state) => ({ previousOrders: state.order, order: orders }));
                    return orders;
                } catch (error) {
                    console.error("Erro ao buscar pedidos do convidado:", error);
                    return [];
                }
            },

            fetchRestaurantUnitOrders: async (restaurantId, unitId) => {
                const token = useAuthStore.getState().token;
                if (!token) {
                    return;
                }
                
                try {
                    if (!unitId && !restaurantId) {
                        throw new Error("ID da unidade ou do restaurante é obrigatório.");
                    }

                    const endpoint = unitId
                        ? `${API_URL}/restaurant/${unitId}/orders`
                        : restaurantId
                            ? `${API_URL}/restaurant/${restaurantId}/orders`
                            : (() => { throw new Error("ID da unidade ou do restaurante é obrigatório."); })();

                    const response = await fetch(endpoint, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.status === 304) return;

                    if (!response.ok) throw new Error('Erro ao buscar pedidos');

                    const fetched: Order[] = await response.json();
                    set((state) => ({
                        previousOrders: mergeOrders(state.order ?? [], fetched),
                        order: fetched
                    }));
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

            fetchOrdersWithMetrics: async (unitId: string) => {
                try {
                    const response = await fetch(`${API_URL}/restaurant-unit/${unitId}/orders/metrics`, {
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

            requestCheckout: async (orderId: string, guestId: string, restaurantId: string, tableId: number, splitCount?: number) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`${API_URL}/restaurant/${restaurantId}/${tableId}/order/${orderId}/request-checkout`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            orderId,
                            guestId,
                            splitCount
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message);
                    }


                    const updatedOrder = await response.json();
                    set(state => ({
                    order: state.order.map(o => (o._id === updatedOrder._id ? updatedOrder : o)),
                    isLoading: false,
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

            cancelOrder: async (orderId: string, restaurantId: string, tableId: number, guestId?: string) => {
                try {
                    const response = await fetch(
                        `${API_URL}/restaurant/${restaurantId}/${tableId}/order/${orderId}/cancel`, {
                        method: 'POST',
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ guestId })
                    });

                    if (!response.ok) throw new Error('Falha ao cancelar pedido');

                    return await response.json();
                } catch (error) {
                    console.error('Erro ao cancelar pedido:', error);
                    throw error;
                }
            },

            cancelOrderItem: async (orderId: string, itemId: string, restaurantId: string, tableId: number, guestId?: string) => {
                const response = await fetch(`${API_URL}/restaurant/${restaurantId}/${tableId}/order/${orderId}/items/${itemId}/cancel`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ guestId }),
                });

                if (!response.ok) throw new Error("Erro ao cancelar item");

                const updatedOrder = await response.json();

                // Atualiza estado
                const orders = get().order.map(o => o._id === updatedOrder._id ? updatedOrder : o);
                set({ order: orders });
            },

            updateOrderStatus: async (restaurantId: string, orderId: string, status: OrderStatusType) => {
                const token = useAuthStore.getState().token;
                try {
                    const response = await fetch(`${API_URL}/restaurant/${restaurantId}/order/${orderId}/status`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ status })
                    });

                    if (!response.ok) throw new Error('Erro ao atualizar status');

                    const updatedOrder = await response.json();

                    const updatedOrders = get().order.map(o => o._id === updatedOrder._id ? updatedOrder : o);
                    set({ order: updatedOrders });

                    return updatedOrder;
                } catch (error) {
                    console.error('Erro na atualização de status:', error);
                    throw error;
                }
            },

            addItemsToOrder: async (restaurantId: string, tableId: number, orderId: string, guestId: string, items: CartItemProps[], totalAmount: number) => {
                try {
                    const itemsWithStatus = items.map(item => ({
                        ...item,
                        status: OrderItemStatus.ADDED
                    }));

                    const response = await fetch(`${API_URL}/restaurant/${restaurantId}/order/${orderId}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            tableId,
                            guestId,
                            items: itemsWithStatus,
                            totalAmount,
                        }),
                    });


                    if (!response.ok) {
                        throw new Error('Falha ao adicionar itens ao pedido');
                    }

                    const updatedOrder = await response.json();

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

            updateOrderItem: async (
                restaurantId: string,
                tableId: number,
                orderId: string,
                itemId: string,
                updates: {
                    quantity?: number;
                    observations?: string
                    status?: OrderItemStatusType;
                },
                guestId?: string) => {
                try {
                    let updatesWithStatus = { ...updates };

                    if (updates.quantity !== undefined && !updates.status) {
                        const order = get().order.find(o => o._id === orderId);
                        const item = order?.items.find(i => i._id === itemId);

                        if (item) {
                            if (updates.quantity < item.quantity) {
                                updatesWithStatus.status = OrderItemStatus.REDUCED;
                            } else {
                                updatesWithStatus.status = OrderItemStatus.ADDED;
                            }
                        }
                    }

                    const response = await fetch(
                        `${API_URL}/restaurant/${restaurantId}/${tableId}/order/${orderId}/items/${itemId}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(guestId ? { ...updatesWithStatus, guestId } : updatesWithStatus)
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
                const currentOrders = get().order;
                const filtered = Array.isArray(currentOrders)
                    ? currentOrders.filter(order => {
                        const createdAt = new Date(order.createdAt);
                        const now = new Date();
                        const diffInDays = (now.getTime() - createdAt.getTime()) / (1000 * 3600 * 24);
                        return diffInDays < 30;
                    })
                    : [];
                set({ order: filtered });
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
                order: Array.isArray(state.order)
                    ? state.order.filter(order =>
                        order.status !== 'completed' &&
                        order.status !== 'cancelled' &&
                        !order.isPaid
                    )
                    : [],
            }),

        }
    )
);

