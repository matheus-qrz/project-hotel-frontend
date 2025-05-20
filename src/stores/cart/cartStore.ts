import { OrderStatus } from '@/components/cart/constants';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    name: string;
}

interface CartStore {
    items: CartItemProps[];
    tableId: string | null;
    restaurantId: string | null;
    unitId: string | null;
    guestInfo: GuestInfo | null;
    orderType: 'local' | 'takeaway';
    observations: string;

    // Ações do carrinho
    addItem: (item: CartItemProps) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    updateItemObservations: (productId: string, observations: string) => void;
    updateItemStatus: (productId: string, status: CartItemProps['status']) => void; // Adicionado
    setOrderType: (type: 'local' | 'takeaway') => void;
    setObservations: (observations: string) => void;
    setOrderObservations: (observations: string) => void;
    clearCart: () => void;

    // Ações de identificação
    setTableInfo: (tableId: string, restaurantId: string, unitId?: string) => void;
    setGuestInfo: (info: GuestInfo) => void;

    // Cálculos
    getTotal: () => number;
}

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
                return { items: [...state.items, item] };
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

            updateItemStatus: (id: string, status: OrderStatus) =>
                set((state) => ({
                    items: state.items.map(item => {
                        if (item.id === id) {
                            console.log(`Atualizando status do item ${item.name} de ${item.status} para ${status}`);
                            return { ...item, status };
                        }
                        return item;
                    })
                })),

            setOrderType: (type) => set({ orderType: type }),

            setObservations: (observations) => set({ observations }),

            setOrderObservations: (observations) => set({ observations }),

            clearCart: () => set({
                items: [],
                guestInfo: null,
                orderType: 'local',
                observations: ''
            }),

            setTableInfo: (tableId, restaurantId, unitId) => set({
                tableId,
                restaurantId,
                unitId: unitId || null
            }),

            setGuestInfo: (info) => set({
                guestInfo: info
            }),

            getTotal: () => {
                const state = get();
                return state.items.reduce((total, item) =>
                    total + (item.price * item.quantity), 0
                );
            }
        }),
        {
            name: 'cart-storage',
            storage: {
                getItem: (name) => {
                    const item = localStorage.getItem(name);
                    return item ? JSON.parse(item) : null;
                },
                setItem: (name, value) => {
                    localStorage.setItem(name, JSON.stringify(value));
                },
                removeItem: (name) => {
                    localStorage.removeItem(name);
                },
            }
        }
    )
);