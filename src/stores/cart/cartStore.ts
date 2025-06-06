// stores/cartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Addon {
    id: string;
    name: string;
    price: number;
}[];

export interface CartItemProps {
    _id: string;
    name: string;
    price: number;
    quantity: number;
    status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'payment_requested' | 'paid';
    observations?: string;
    image: string;
    addons?: Addon[];
}

interface GuestInfo {
    id: string;
    name: string;
    joinedAt: string;
}

const calculateTotalPrice = (basePrice: number, addons: Addon[]): number => {
    const addonsPrice = addons.reduce((total, addon) => total + addon.price, 0);
    return basePrice + addonsPrice;
};

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
    updateItemAddons: (productId: string, addons: Addon[]) => void;
    setOrderType: (type: 'local' | 'takeaway') => void;
    setObservations: (observations: string) => void;
    clearCart: () => void;
    initializeGuest: (guestInfo: GuestInfo) => void; // Armazene o guestInfo completo
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
            if (typeof window === 'undefined') {
                return null;
            }
            const value = localStorage.getItem(name);
            if (!value) return null;
            const parsed = JSON.parse(value);
            if (JSON.stringify(parsed).length > 5242880) {
                const trimmedData = { ...parsed, items: parsed.items.slice(-20) };
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
            if (typeof window === 'undefined') {
                return;
            }
            if (value.length > 5242880) {
                const parsed = JSON.parse(value);
                const trimmedData = { ...parsed, items: parsed.items.slice(-20) };
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
            if (typeof window === 'undefined') {
                return;
            }
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

            initializeGuest: (guestInfo: { id: string; name: string; joinedAt: string }) => {
                set({ guestInfo, items: [] }); // Armazene o guestInfo completo
            },

            addItem: (item) => set((state) => {
                const existingItem = state.items.find(i => i._id === item._id);
                const totalPrice = calculateTotalPrice(item.price, item.addons || []);

                if (existingItem) {
                    return {
                        items: state.items.map(i =>
                            i._id === item._id
                                ? { ...i, quantity: i.quantity + item.quantity, price: totalPrice }
                                : i
                        )
                    };
                }
                const newItem = { ...item, price: totalPrice };
                const newItems = [...state.items, newItem];
                return { items: newItems.slice(-20) };
            }),

            removeItem: (_id) => set((state) => ({
                items: state.items.filter(i => i._id !== _id)
            })),

            updateQuantity: (_id, quantity) => set((state) => ({
                items: state.items.map(i =>
                    i._id === _id ? { ...i, quantity } : i
                )
            })),

            updateItemObservations: (_id, observations) => set((state) => ({
                items: state.items.map(i =>
                    i._id === _id ? { ...i, observations } : i
                )
            })),

            updateItemStatus: (_id, status) => set((state) => ({
                items: state.items.map(item => {
                    if (item._id === _id) {
                        return { ...item, status };
                    }
                    return item;
                })
            })),

            updateItemAddons: (_id, addons) => set((state) => {
                return {
                    items: state.items.map(item => {
                        if (item._id === _id) {
                            const newPrice = calculateTotalPrice(item.price, addons);
                            return { ...item, addons, price: newPrice };
                        }
                        return item;
                    })
                };
            }),

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

