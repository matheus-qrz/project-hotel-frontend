// stores/tableStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GuestInfo {
    id: string;
    name: string;
    joinedAt: string;
}

interface TableState {
    tableId: number | null;
    restaurantId: string | null;
    unitId: string | null;
    activeGuests: GuestInfo[];

    setTableInfo: (tableId: number, restaurantId: string, unitId?: string) => void;
    addGuest: (guestInfo: GuestInfo) => void;
    clearTableInfo: () => void;
}

export const useTableStore = create<TableState>()(
    persist(
        (set) => ({
            tableId: null,
            restaurantId: null,
            unitId: null,
            activeGuests: [],

            setTableInfo: (tableId, restaurantId, unitId) => set({
                tableId,
                restaurantId,
                unitId: unitId || null
            }),

            addGuest: (guestInfo) => set(state => ({
                activeGuests: [...state.activeGuests, guestInfo]
            })),

            clearTableInfo: () => set({
                tableId: null,
                restaurantId: null,
                unitId: null,
                activeGuests: [],
            }),
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