// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Session } from 'next-auth';

interface GuestInfo {
    name: string;
    email?: string;
    phone?: string;
}

type RegisterAdminWithRestaurantPayload = {
  firstName: string;
  lastName: string;
  cpf: string;
  email: string;
  password: string;
  phone?: string;
  name: string;
  socialName?: string;
  cnpj: string;
  specialty?: string;
  address: {
    zipCode: string;
    street: string;
    number: number;
    complement?: string;
  };
  businessHours: Array<{
    days: string[];   // ex.: ["Segunda", "Terça"]
    open: string;     // "08:00"
    close: string;    // "18:00"
  }>;
};

type RegisterAdminWithRestaurantSuccess = {
  success: true;
  message?: string;
  user: { _id: string; firstName: string; lastName: string; email: string; role: 'ADMIN' | string };
  restaurant: { _id: string; name: string };
  unit?: { _id: string; name: string };
  token: string;
};

type RegisterAdminWithRestaurantFail = {
  success: false;
  message: string;
};

type RegisterAdminWithRestaurantResult =
  | RegisterAdminWithRestaurantSuccess
  | RegisterAdminWithRestaurantFail;

interface AuthState {
    restaurantId: string | null;
    unitId: string | null;
    token: string | null;
    role: string | null;
    tokenExpiry: number | null;
    isGuest: boolean;
    guestInfo: GuestInfo | null;
    tableNumber: string | null;

    isLoading: boolean;
    setLoading: (v: boolean) => void;
    withLoading: <T>(fn: () => Promise<T>) => Promise<T>;

    // Métodos existentes
    setRestaurantId: (id: string) => void;
    setUnitId: (id: string) => void;
    setToken: (token: string | null, role?: string | null) => void;
    setUserRole: (role: string) => void;
    updateFromSession: (session: Session | null) => void;
    clear: () => void;
    getHeaders: () => Record<string, string>;
    isTokenExpired: () => boolean;

    // Cadastro de Admin com Restaurante
    registerAdminWithRestaurant: (payload: RegisterAdminWithRestaurantPayload) => Promise<RegisterAdminWithRestaurantResult>;

    // Novos métodos para guest
    setGuestInfo: (info: GuestInfo) => void;
    setTableNumber: (tableNumber: string) => void;
    createGuestToken: () => string;

    _hydrated: boolean;
    setHydrated: () => void;
}

const SESSION_DURATION = 14 * 60 * 60 * 1000; // 14 horas em milissegundos
const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            restaurantId: null,
            unitId: null,
            token: null,
            role: null,
            tokenExpiry: null,
            isGuest: false,
            guestInfo: null,
            tableNumber: null,
            isLoading: false,
            _hydrated: false,
            
            setHydrated: () => set({ _hydrated: true }),
            setLoading: (v) => set({ isLoading: v }),
            withLoading: async (fn) => {
                set({ isLoading: true });
                try {
                return await fn();
                } finally {
                set({ isLoading: false });
                }
            },

            setRestaurantId: (id: string) => {
                if (typeof id !== 'string') {
                    console.error('Invalid restaurant ID:', id);
                    return;
                }
                set({ restaurantId: id });
            },

            setUnitId: (id) => set({ unitId: id }),

            setToken: (token, role) => set({ token: token, role: role ?? null }),

            setUserRole: (role) => set({ role }),

            updateFromSession: (session) => {
                if (session) {
                    const expiry = Date.now() + SESSION_DURATION;

                    set({
                        restaurantId: session.user?.restaurantId || null,
                        unitId: session.user?.unitId || null,
                        token: session.token || null,
                        role: session.user?.role || null,
                        tokenExpiry: expiry,
                        isGuest: false
                    });
                }
            },

            clear: () => set({
                restaurantId: null,
                unitId: null,
                token: null,
                role: null,
                tokenExpiry: null,
                isGuest: false,
                guestInfo: null,
                tableNumber: null
            }),

            getHeaders: () => {
                const token = get().token;
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json',
                };

                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                return headers;
            },

            registerAdminWithRestaurant: async (
            payload: RegisterAdminWithRestaurantPayload
            ): Promise<RegisterAdminWithRestaurantResult> => {
            set({ isLoading: true });
            try {
                const resp = await fetch(`${API_URL}/register/restaurant`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                });

                const data = await resp.json().catch(() => ({}));

                if (!resp.ok) {
                const message = data?.message || data?.error || "Erro ao registrar";
                return { success: false, message };
                }

                const { user, restaurant, unit, token, message } = data;

                // Persistir sessão
                set({
                token: token ?? null,
                role: user?.role ?? "ADMIN",
                restaurantId: restaurant?._id ?? null,
                unitId: unit?._id ?? null,
                isGuest: false,
                guestInfo: null,
                tableNumber: null,
                });

                return { success: true, message, user, restaurant, unit, token };
            } catch (e: any) {
                return { success: false, message: e?.message || "Erro inesperado ao registrar" };
            } finally {
                set({ isLoading: false });
            }
            },

            isTokenExpired: () => {
                const { tokenExpiry } = get();
                if (!tokenExpiry) return true;
                return Date.now() > tokenExpiry;
            },

            setGuestInfo: (info) => set({
                guestInfo: info,
                isGuest: true
            }),

            setTableNumber: (tableNumber) => set({ tableNumber }),

            createGuestToken: () => {
                const token = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
                const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
                set({
                    token,
                    tokenExpiry: expiry,
                    isGuest: true
                });
                return token;
            },
        }),
        {
            name: 'restaurant-storage',
            partialize: (state) => ({
                restaurantId: state.restaurantId,
                unitId: state.unitId,
                token: state.token,
                role: state.role,
                tokenExpiry: state.tokenExpiry,
                isGuest: state.isGuest,
                guestInfo: state.guestInfo,
                tableNumber: state.tableNumber
            }),
        }
    )
);