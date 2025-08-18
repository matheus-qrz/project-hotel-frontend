// stores/guestStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GuestInfo {
    id: string;
    name: string;
    joinedAt: string;
}

interface GuestStore {
    guestInfo: GuestInfo | null;
    tableId: number | null;
    restaurantId: string | null;
    orderId: string | null;
    setGuestInfo: (info: GuestInfo) => void;
    setTableId: (tableId: number) => void;
    setRestaurantId: (id: string) => void;
    setOrderId: (id: string) => void;
    clearGuestSession: () => void;
    sessionId: string | null;
    setSessionId: (id: string) => void;

}

export const useGuestStore = create<GuestStore>()(
    persist(
        (set) => ({
            guestInfo: null,
            tableId: null,
            restaurantId: null,
            orderId: null,
            sessionId: null,

            setGuestInfo: (info) => set({ guestInfo: info }),
            setTableId: (tableId) => set({ tableId }),
            setRestaurantId: (id) => set({ restaurantId: id }),
            setOrderId: (id) => set({ orderId: id }),
            setSessionId: (id) => set({ sessionId: id }),

            clearGuestSession: () => {
                set({
                    guestInfo: null,
                    tableId: null,
                    restaurantId: null,
                    orderId: null,
                });
            },
        }),
        {
            name: 'guest-storage', // chave usada no localStorage
        }
    )
);
