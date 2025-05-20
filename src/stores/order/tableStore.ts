// stores/tableStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TableState {
    tableId: string | null;
    restaurantId: string | null;
    unitId: string | null;
    isCheckoutRequested: boolean;
    splitCount: number;

    // Ações
    setTableInfo: (tableId: string, restaurantId: string, unitId?: string) => void;
    requestCheckout: (splitCount: number) => void;
    clearTableInfo: () => void;
    getTableIdentifier: () => string | null;
}

export const useTableStore = create<TableState>()(
    persist(
        (set, get) => ({
            tableId: null,
            restaurantId: null,
            unitId: null,
            isCheckoutRequested: false,
            splitCount: 1,

            setTableInfo: (tableId, restaurantId, unitId) => set({
                tableId,
                restaurantId,
                unitId: unitId || null,
                isCheckoutRequested: false,
                splitCount: 1
            }),

            requestCheckout: (splitCount) => set({
                isCheckoutRequested: true,
                splitCount
            }),

            clearTableInfo: () => set({
                tableId: null,
                restaurantId: null,
                unitId: null,
                isCheckoutRequested: false,
                splitCount: 1
            }),

            getTableIdentifier: () => {
                const state = get();
                if (!state.tableId || !state.restaurantId) return null;
                return `${state.restaurantId}-${state.unitId || 'main'}-${state.tableId}`;
            }
        }),
        {
            name: 'table-storage',
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