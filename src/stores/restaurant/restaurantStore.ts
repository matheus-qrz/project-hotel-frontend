import { extractIdFromSlug } from "@/utils/slugify";
import { create } from "zustand";
import { useAuthStore } from "../auth";

// types/restaurant.ts
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

// stores/restaurantStore.ts
interface RestaurantStore {
    restaurant: Restaurant | null;
    isLoading: boolean;
    error: string | null;

    // Ações básicas
    fetchRestaurantData: (slug: string) => Promise<void>;
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

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export const useRestaurantStore = create<RestaurantStore>((set, get) => ({
    restaurant: null,
    isLoading: false,
    error: null,

    // useRestaurantStore.ts
    fetchRestaurantData: async (slug: string) => {
        try {
            set({ isLoading: true, error: null });

            // Garante que estamos usando apenas o slug básico
            const cleanSlug = slug.split('?')[0]; // Remove query params se houver

            const response = await fetch(`${API_URL}/restaurant/by-slug/${cleanSlug}`, {
                headers: {
                    ...useAuthStore.getState().getHeaders(),
                }
            });

            if (!response.ok) {
                throw new Error('Falha ao carregar dados do restaurante');
            }

            const data = await response.json();
            set({ restaurant: data });
        } catch (error: any) {
            set({ error: error.message });
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

            const response = await fetch(`${API_URL}/restaurant/${restaurant._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...useAuthStore.getState().getHeaders()
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao carregar dados do restaurante');
            }

            const updatedData = await response.json();
            set({ restaurant: { ...restaurant, ...updatedData } });
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateBusinessHours: async (hours: BusinessHours[]) => {
        const { restaurant } = get();
        if (!restaurant) return;

        await get().updateRestaurantInfo({ businessHours: hours });
    },

    updateAddress: async (address: Address) => {
        const { restaurant } = get();
        if (!restaurant) return;

        await get().updateRestaurantInfo({ address });
    },

    updateAdminInfo: async (adminInfo: Partial<AdminInfo>) => {
        const { restaurant } = get();
        if (!restaurant) return;

        await get().updateRestaurantInfo({ admin: { ...restaurant.admin, ...adminInfo } });
    },

    addManager: async (userId: string) => {
        const { restaurant } = get();
        if (!restaurant) return;

        const managers = [...restaurant.managers, userId];
        await get().updateRestaurantInfo({ managers });
    },

    removeManager: async (userId: string) => {
        const { restaurant } = get();
        if (!restaurant) return;

        const managers = restaurant.managers.filter((id: string) => id !== userId);
        await get().updateRestaurantInfo({ managers });
    },

    addAttendant: async (userId: string) => {
        const { restaurant } = get();
        if (!restaurant) return;

        const attendants = [...restaurant.attendants, userId];
        await get().updateRestaurantInfo({ attendants });
    },

    removeAttendant: async (userId: string) => {
        const { restaurant } = get();
        if (!restaurant) return;

        const attendants = restaurant.attendants.filter((id: string) => id !== userId);
        await get().updateRestaurantInfo({ attendants });
    },

    addUnit: async (unitId: string) => {
        const { restaurant } = get();
        if (!restaurant) return;

        const units = [...restaurant.units, unitId];
        await get().updateRestaurantInfo({ units });
    },

    removeUnit: async (unitId: string) => {
        const { restaurant } = get();
        if (!restaurant) return;

        const units = restaurant.units.filter((id: string) => id !== unitId);
        await get().updateRestaurantInfo({ units });
    },

    getBusinessHoursForDay: (day: string) => {
        const { restaurant } = get();
        if (!restaurant?.businessHours) return null;

        return restaurant.businessHours.find((hours: any) =>
            hours.days.includes(day.toLowerCase())
        ) || null;
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