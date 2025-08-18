// src/stores${API_URL}/restaurantUnitStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from '../index'; 

export interface RestaurantUnit {
    _id: string;
    name: string;
    manager: string;
    cnpj: string;
    status: "active" | "outOfHours" | "inactive";
    isTopSeller?: boolean;
    isMatrix?: boolean;
    address?: {
        street: string;
        number: string;
        complement?: string;
        zipCode: string;
    };
    businessHours?: Array<{
        days: string[];
        opens: string;
        closes: string;
    }>;
}

interface RestaurantUnitState {
    units: RestaurantUnit[];
    currentUnitId: string | null; 
    fetchUnits: (restaurantId: string, token: string) => Promise<void>;
    fetchUnitByRestaurantId: (restaurantId: string) => Promise<string | null>;
    addUnit: (restaurantId: string, unitData: Omit<RestaurantUnit, 'id'>) => Promise<void>;
    updateUnit: (unitId: string, unitData: Partial<Omit<RestaurantUnit, 'id'>>) => Promise<void>;
    deleteUnit: (unitId: string, restaurantId: string) => Promise<void>;
    setCurrentUnitId: (unitId: string | null) => void; 
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export const useRestaurantUnitStore = create<RestaurantUnitState>()(
    persist(
        (set) => ({
            units: [],
            currentUnitId: null,
            setCurrentUnitId: (id) => set({ currentUnitId: id }),

            fetchUnits: async (restaurantId: string, token: string) => {
                try {
                    const headers = useAuthStore.getState().getHeaders();
                    const response = await fetch(`${API_URL}/restaurant/${restaurantId}/units?includeMatrix=true`, {
                        headers,
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    });

                    if (!response.ok) {
                        throw new Error('Erro ao buscar unidades');
                    }

                    const data = await response.json();
                    const formattedUnits = data.units.map((unit: any) => ({
                        _id: unit._id,
                        name: unit.name,
                        manager: unit.managers && unit.managers[0]
                            ? `${unit.managers[0].firstName} ${unit.managers[0].lastName}`
                            : 'Sem gerente',
                        cnpj: unit.cnpj,
                        status: unit.status,
                        isTopSeller: unit.isTopSeller || false,
                        isMatrix: unit.isMatrix || false
                    }));

                    set({ units: formattedUnits });
                } catch (error) {
                    console.error('Erro ao buscar unidades:', error);
                    throw error;
                }
            },

            fetchUnitByRestaurantId: async (restaurantId: string) => {
                try {
                    const headers = useAuthStore.getState().getHeaders();
;
                    const response = await fetch(`${API_URL}/restaurant/${restaurantId}/units`, {
                        headers,
                    });

                    if (!response.ok) {
                        throw new Error('Erro ao buscar unidades');
                    }

                    const units = await response.json();

                    if (Array.isArray(units) && units.length > 0) {
                        const unitId = units[0]._id;
                        set({ currentUnitId: unitId });
                        return unitId;
                    }

                    const restaurantResponse = await fetch(`${API_URL}/restaurant/${restaurantId}`, {
                        headers,
                    });

                    if (restaurantResponse.ok) {
                        const restaurant = await restaurantResponse.json();
                        if (restaurant && restaurantId) {
                            set({ currentUnitId: restaurantId });
                            return restaurantId;
                        }
                    }

                    return null;
                } catch (error) {
                    console.error('Erro ao buscar unidade:', error);
                    return null;
                }
            },

            addUnit: async (restaurantId: string, unitData: Omit<RestaurantUnit, 'id'>) => {
                try {
                    const headers = useAuthStore.getState().getHeaders();
                    const response = await fetch(`${API_URL}/restaurant/${restaurantId}/units`, {
                        method: 'POST',
                        headers: {
                            ...headers,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(unitData),
                    });

                    if (!response.ok) {
                        throw new Error('Erro ao adicionar unidade');
                    }

                    const newUnit = await response.json();
                    set((state) => ({ units: [...state.units, newUnit] }));
                } catch (error) {
                    console.error('Erro ao adicionar unidade:', error);
                }
            },

            updateUnit: async (unitId: string, unitData: Partial<Omit<RestaurantUnit, 'id'>>) => {
                try {
                    const headers = useAuthStore.getState().getHeaders();
;
                    const response = await fetch(`${API_URL}/unit/${unitId}`, {
                        method: 'PUT',
                        headers: {
                            ...headers,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(unitData),
                    });

                    if (!response.ok) {
                        throw new Error('Erro ao atualizar unidade');
                    }

                    const updatedUnit = await response.json();
                    set((state) => ({
                        units: state.units.map((unit) =>
                            unit._id === unitId ? { ...unit, ...updatedUnit } : unit
                        ),
                    }));
                } catch (error) {
                    console.error('Erro ao atualizar unidade:', error);
                }
            },

            deleteUnit: async (unitId: string, restaurantId: string) => {
                try {
                    const headers = useAuthStore.getState().getHeaders(); 

                    const response = await fetch(`${API_URL}/restaurant/${restaurantId}/units/${unitId}`, {
                        method: 'DELETE',
                        headers,
                    });

                    if (!response.ok) {
                        throw new Error('Erro ao deletar unidade');
                    }

                    set((state) => ({
                        units: state.units.filter((unit) => unit._id !== unitId),
                    }));
                } catch (error) {
                    console.error('Erro ao deletar unidade:', error);
                }
            },
        }),
        {
            name: 'restaurant-unit-storage',
        }
    )
);