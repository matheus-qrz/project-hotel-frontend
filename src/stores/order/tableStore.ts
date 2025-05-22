// stores/tableStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GuestInfo {
    id: string;
    name: string;
    joinedAt: string;
}

interface TableState {
    tableId: string | null;
    restaurantId: string | null;
    unitId: string | null;
    isCheckoutRequested: boolean;
    splitCount: number;
    activeGuests: GuestInfo[];
    currentGuestId: string | null;

    // Ações principais
    setTableInfo: (tableId: string, restaurantId: string, unitId?: string) => void;
    requestCheckout: (guestId: string, splitCount: number) => void;
    clearTableInfo: () => void;
    getTableIdentifier: () => string | null;

    // Ações relacionadas aos convidados
    addGuest: (guestInfo: GuestInfo) => void;
    removeGuest: (guestId: string) => void;
    setCurrentGuest: (guestId: string) => void;
    getGuestInfo: (guestId: string) => GuestInfo | null;
    getAllGuests: () => GuestInfo[];
    getActiveGuestsCount: () => number;
    clearGuests: () => void;
}

export const useTableStore = create<TableState>()(
    persist(
        (set, get) => ({
            tableId: null,
            restaurantId: null,
            unitId: null,
            isCheckoutRequested: false,
            splitCount: 1,
            activeGuests: [],
            currentGuestId: null,

            setTableInfo: (tableId, restaurantId, unitId) => set({
                tableId,
                restaurantId,
                unitId: unitId || null,
                isCheckoutRequested: false,
                splitCount: 1
            }),

            requestCheckout: (guestId, splitCount) => set(state => ({
                activeGuests: state.activeGuests.map(guest =>
                    guest.id === guestId
                        ? { ...guest, isCheckoutRequested: true, splitCount }
                        : guest
                )
            })),

            clearTableInfo: () => set({
                tableId: null,
                restaurantId: null,
                unitId: null,
                isCheckoutRequested: false,
                splitCount: 1,
                activeGuests: [],
                currentGuestId: null
            }),

            getTableIdentifier: () => {
                const state = get();
                if (!state.tableId || !state.restaurantId) return null;
                return `${state.restaurantId}-${state.unitId || 'main'}-${state.tableId}`;
            },

            // Métodos de gestão de convidados
            addGuest: (guestInfo) => set(state => ({
                activeGuests: [...state.activeGuests, {
                    ...guestInfo,
                    isCheckoutRequested: false,
                    splitCount: 1
                }],
                currentGuestId: state.currentGuestId || guestInfo.id
            })),

            removeGuest: (guestId) => set(state => ({
                activeGuests: state.activeGuests.filter(guest => guest.id !== guestId),
                currentGuestId: state.currentGuestId === guestId
                    ? state.activeGuests[0]?.id || null
                    : state.currentGuestId
            })),

            setCurrentGuest: (guestId) => set(state => {
                if (state.activeGuests.some(guest => guest.id === guestId)) {
                    return { currentGuestId: guestId };
                }
                return state;
            }),

            getGuestInfo: (guestId) => {
                const state = get();
                return state.activeGuests.find(guest => guest.id === guestId) || null;
            },

            getAllGuests: () => {
                return get().activeGuests;
            },

            getActiveGuestsCount: () => {
                return get().activeGuests.length;
            },

            clearGuests: () => set({
                activeGuests: [],
                currentGuestId: null
            })
        }),
        {
            name: 'table-storage',
            partialize: (state) => ({
                tableId: state.tableId,
                restaurantId: state.restaurantId,
                unitId: state.unitId,
            })
        }
    )
);