// stores/cartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItemProps {
    id: string;
    name: string;
    price: number;
    quantity: number;
    status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'payment_requested' | 'paid';
    observations?: string;
    image: string;
}

interface GuestInfo {
    id: string;
    name: string;
    joinedAt: string;
}

interface CartStore {
    items: CartItemProps[];
    tableId: string | null;
    restaurantId: string | null;
    unitId: string | null;
    guestInfo: GuestInfo | null;
    orderType: 'local' | 'takeaway';
    observations: string;

    addItem: (item: CartItemProps) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    updateItemObservations: (productId: string, observations: string) => void;
    updateItemStatus: (productId: string, status: CartItemProps['status']) => void;
    setOrderType: (type: 'local' | 'takeaway') => void;
    setObservations: (observations: string) => void;
    clearCart: () => void;
    initializeGuest: (name: string) => void;
    setTableInfo: (tableId: string, restaurantId: string, unitId?: string) => void;
    getGuestId: () => string | null;
    getTotal: () => number;
}

type StorageType = {
    getItem: (name: string) => Promise<string | null>;
    setItem: (name: string, value: string) => Promise<void>;
    removeItem: (name: string) => Promise<void>;
};

const customStorage: StorageType = {
    getItem: async (name: string) => {
        try {
            const value = localStorage.getItem(name);
            if (!value) return null;

            const parsed = JSON.parse(value);
            if (JSON.stringify(parsed).length > 5242880) {
                const trimmedData = {
                    ...parsed,
                    items: parsed.items.slice(-20)
                };
                await customStorage.setItem(name, JSON.stringify(trimmedData));
                return JSON.stringify(trimmedData);
            }
            return value;
        } catch (error) {
            console.error('Erro ao ler do localStorage:', error);
            return null;
        }
    },
    setItem: async (name: string, value: string) => {
        try {
            if (value.length > 5242880) {
                const parsed = JSON.parse(value);
                const trimmedData = {
                    ...parsed,
                    items: parsed.items.slice(-20)
                };
                localStorage.setItem(name, JSON.stringify(trimmedData));
            } else {
                localStorage.setItem(name, value);
            }
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
        }
    },
    removeItem: async (name: string) => {
        try {
            localStorage.removeItem(name);
        } catch (error) {
            console.error('Erro ao remover do localStorage:', error);
        }
    }
};

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            tableId: null,
            restaurantId: null,
            unitId: null,
            guestInfo: null,
            orderType: 'local',
            observations: '',

            initializeGuest: (name: string) => {
                const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                set({
                    guestInfo: {
                        id: guestId,
                        name,
                        joinedAt: new Date().toISOString()
                    }
                });
            },

            addItem: (item) => set((state) => {
                const existingItem = state.items.find(i => i.id === item.id);
                if (existingItem) {
                    return {
                        items: state.items.map(i =>
                            i.id === item.id
                                ? { ...i, quantity: i.quantity + item.quantity }
                                : i
                        )
                    };
                }
                const newItems = [...state.items, item];
                return { items: newItems.slice(-20) };
            }),

            removeItem: (id) => set((state) => ({
                items: state.items.filter(i => i.id !== id)
            })),

            updateQuantity: (id, quantity) => set((state) => ({
                items: state.items.map(i =>
                    i.id === id ? { ...i, quantity } : i
                )
            })),

            updateItemObservations: (id, observations) => set((state) => ({
                items: state.items.map(i =>
                    i.id === id ? { ...i, observations } : i
                )
            })),

            updateItemStatus: (id, status) => set((state) => ({
                items: state.items.map(item => {
                    if (item.id === id) {
                        return { ...item, status };
                    }
                    return item;
                })
            })),

            setOrderType: (type) => set({ orderType: type }),

            setObservations: (observations) => set({ observations }),

            clearCart: () => set({
                items: [],
                orderType: 'local',
                observations: ''
            }),

            setTableInfo: (tableId, restaurantId, unitId) => set({
                tableId,
                restaurantId,
                unitId: unitId || null
            }),

            getGuestId: () => {
                const state = get();
                return state.guestInfo?.id || null;
            },

            getTotal: () => {
                const state = get();
                return state.items.reduce((total, item) =>
                    total + (item.price * item.quantity), 0
                );
            }
        }),
        {
            name: 'cart-storage',
            storage: createJSONStorage(() => customStorage),
            partialize: (state: CartStore) => ({
                items: state.items,
                tableId: state.tableId,
                restaurantId: state.restaurantId,
                unitId: state.unitId,
                orderType: state.orderType,
                observations: state.observations,
                guestInfo: state.guestInfo
            })
        }
    )
);