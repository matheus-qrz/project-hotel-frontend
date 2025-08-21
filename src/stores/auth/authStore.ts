// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Session } from 'next-auth';

interface GuestInfo {
    name: string;
    email?: string;
    phone?: string;
}

interface AuthState {
    restaurantId: string | null;
    unitId: string | null;
    token: string | null;
    role: string | null;
    tokenExpiry: number | null;
    isGuest: boolean;
    isAuthenticated: boolean;
    guestInfo: GuestInfo | null;
    tableNumber: string | null;

    isLoading: boolean;
    setLoading: (v: boolean) => void;
    withLoading: <T>(fn: () => Promise<T>) => Promise<T>;

    // Métodos existentes
    setIsAuthenticated: (v: boolean) => void;
    setRestaurantId: (id: string) => void;
    setUnitId: (id: string) => void;
    setToken: (token: string | null, role?: string | null) => void;
    setUserRole: (role: string) => void;
    updateFromSession: (session: Session | null) => void;
    clear: () => void;
    getHeaders: () => Record<string, string>;
    isTokenExpired: () => boolean;

    // Novos métodos para guest
    setGuestInfo: (info: GuestInfo) => void;
    setTableNumber: (tableNumber: string) => void;
    createGuestToken: () => string;

    _hydrated: boolean;
    setHydrated: () => void;
}

const SESSION_DURATION = 14 * 60 * 60 * 1000; // 14 horas em milissegundos

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            restaurantId: null,
            unitId: null,
            token: null,
            role: null,
            tokenExpiry: null,
            isGuest: false,
            isAuthenticated: false,
            guestInfo: null,
            tableNumber: null,
            isLoading: false,
            _hydrated: false,
            
            setIsAuthenticated: (v) => set({ isAuthenticated: v }),
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