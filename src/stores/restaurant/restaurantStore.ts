// stores/restaurantStore.ts
import { create } from "zustand";
import { useAuthStore } from "../auth";

export interface Address {
    zipCode: string;
    street: string;
    number: number;
    complement: string;
}

export interface AdminInfo {
    email: string;
    fullName: string;
    cpf: string;
}

export interface BusinessHours {
    days: string[];
    open: string;
    close: string;
}

export interface Restaurant {
    _id: string;
    name: string;
    logo: string;
    cnpj: string;
    socialName: string;
    address: Address;
    rating: number;
    specialty: string;
    phone: string;
    admin: AdminInfo;
    managers: string[];
    attendants: string[];
    units: string[];
    businessHours?: BusinessHours[];
    createdAt: string;
    updatedAt: string;
}

interface RestaurantStore {
    restaurant: Restaurant | null;
    isLoading: boolean;
    error: string | null;

    fetchRestaurantBySlug: (slug: string) => Promise<void>;
    fetchRestaurantById: (id: string) => Promise<void>;
    updateRestaurantInfo: (data: Partial<Restaurant>) => Promise<void>;

    // Ações específicas
    updateBusinessHours: (hours: BusinessHours[]) => Promise<void>;
    updateAddress: (address: Address) => Promise<void>;
    updateAdminInfo: (adminInfo: Partial<AdminInfo>) => Promise<void>;

    // Gerenciamento de equipe
    addManager: (userId: string) => Promise<void>;
    removeManager: (userId: string) => Promise<void>;
    addAttendant: (userId: string) => Promise<void>;
    removeAttendant: (userId: string) => Promise<void>;

    // Unidades
    addUnit: (unitId: string) => Promise<void>;
    removeUnit: (unitId: string) => Promise<void>;

    // Utilitários
    getBusinessHoursForDay: (day: string) => BusinessHours | null;
    isOpenNow: () => boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const useRestaurantStore = create<RestaurantStore>((set, get) => ({
    restaurant: null,
    isLoading: false,
    error: null,

    fetchRestaurantBySlug: async (slug: string) => {
        try {
            set({ isLoading: true, error: null });

            const normalizedSlug = slug
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase();

            const res = await fetch(`${API_URL}/restaurant/by-slug/${normalizedSlug}`, {
                headers: {
                    ...useAuthStore.getState().getHeaders()
                }
            });

            if (!res.ok) throw new Error('Restaurante não encontrado');
            const data = await res.json();

            set({ restaurant: data });
        } catch (error: any) {
            set({ error: error.message || 'Erro ao buscar restaurante' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    fetchRestaurantById: async (id: string) => {
        try {
            set({ isLoading: true, error: null });

            const res = await fetch(`${API_URL}/restaurant/${id}`, {
                headers: {
                    ...useAuthStore.getState().getHeaders()
                }
            });

            if (!res.ok) throw new Error('Restaurante não encontrado');
            const data = await res.json();

            set({ restaurant: data });
        } catch (error: any) {
            set({ error: error.message || 'Erro ao buscar restaurante' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateRestaurantInfo: async (data: Partial<Restaurant>) => {
        const { restaurant } = get();
        if (!restaurant) return;

        try {
            set({ isLoading: true, error: null });

            const res = await fetch(`${API_URL}/restaurant/${restaurant._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...useAuthStore.getState().getHeaders()
                },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Erro ao atualizar restaurante');
            }

            const updated = await res.json();
            set({ restaurant: { ...restaurant, ...updated } });
        } catch (error: any) {
            set({ error: error.message || 'Erro ao atualizar restaurante' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateBusinessHours: async (hours) => {
        await get().updateRestaurantInfo({ businessHours: hours });
    },

    updateAddress: async (address) => {
        await get().updateRestaurantInfo({ address });
    },

    updateAdminInfo: async (adminInfo) => {
        const { restaurant } = get();
        if (!restaurant) return;
        await get().updateRestaurantInfo({ admin: { ...restaurant.admin, ...adminInfo } });
    },

    addManager: async (userId) => {
        const { restaurant } = get();
        if (!restaurant) return;
        const updated = [...restaurant.managers, userId];
        await get().updateRestaurantInfo({ managers: updated });
    },

    removeManager: async (userId) => {
        const { restaurant } = get();
        if (!restaurant) return;
        const updated = restaurant.managers.filter(id => id !== userId);
        await get().updateRestaurantInfo({ managers: updated });
    },

    addAttendant: async (userId) => {
        const { restaurant } = get();
        if (!restaurant) return;
        const updated = [...restaurant.attendants, userId];
        await get().updateRestaurantInfo({ attendants: updated });
    },

    removeAttendant: async (userId) => {
        const { restaurant } = get();
        if (!restaurant) return;
        const updated = restaurant.attendants.filter(id => id !== userId);
        await get().updateRestaurantInfo({ attendants: updated });
    },

    addUnit: async (unitId) => {
        const { restaurant } = get();
        if (!restaurant) return;
        const updated = [...restaurant.units, unitId];
        await get().updateRestaurantInfo({ units: updated });
    },

    removeUnit: async (unitId) => {
        const { restaurant } = get();
        if (!restaurant) return;
        const updated = restaurant.units.filter(id => id !== unitId);
        await get().updateRestaurantInfo({ units: updated });
    },

    getBusinessHoursForDay: (day: string) => {
        const { restaurant } = get();
        if (!restaurant?.businessHours) return null;

        return (
            restaurant.businessHours.find((h) => h.days.includes(day.toLowerCase())) || null
        );
    },

    isOpenNow: () => {
        const { restaurant } = get();
        if (!restaurant?.businessHours) return false;

        const now = new Date();
        const currentDay = now.toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
        const currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const todayHours = get().getBusinessHoursForDay(currentDay);
        if (!todayHours) return false;

        return currentTime >= todayHours.open && currentTime <= todayHours.close;
    }
}));
