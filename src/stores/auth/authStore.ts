import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'ADMIN' | 'MANAGER' | 'ATTENDANT';
}

interface RestaurantInfo {
    _id: string;
    name: string;
}

interface RestaurantUnitInfo {
    _id: string;
    name: string;
}

interface AuthStore {
    token: string | null;
    user: AuthUser | null;
    restaurant: RestaurantInfo | null;
    units: RestaurantUnitInfo[];
    role: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setToken: (token: string | null) => void;
    setUser: (user: AuthUser | null) => void;
    setRestaurant: (restaurant: RestaurantInfo | null) => void;
    setUnits: (units: RestaurantUnitInfo[]) => void;
    setRole: (role: string | null) => void;
    setAuthenticated: (auth: boolean) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
    hasHydrated: boolean;
    setHasHydrated: (hydrate: boolean) => void;
    rehydrate: () => Promise<void>;
    registerAdminWithRestaurant: (formData: {
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
        address?: {
            zipCode: string;
            street: string;
            number: number;
            complement?: string;
        };
        businessHours?: string[];
    }) => Promise<
        | { success: true; token: string; restaurant: string; user: string; message?: undefined }
        | { success: false; message: string; token?: undefined; restaurant?: undefined; user?: undefined }
    >;

}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            restaurant: null,
            units: [],
            role: null,
            isAuthenticated: false,
            isLoading: true,
            hasHydrated: false,

            setToken: (token) => set({ token }),
            setUser: (user) => set({ user }),
            setRestaurant: (restaurant) => set({ restaurant }),
            setUnits: (units) => set({ units }),
            setRole: (role) => set({ role }),
            setAuthenticated: (auth) => set({ isAuthenticated: auth }),
            setLoading: (loading) => set({ isLoading: loading }),
            logout: () => {
                localStorage.removeItem('auth_token');
                set({
                    token: null,
                    user: null,
                    restaurant: null,
                    units: [],
                    role: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            },

            setHasHydrated: (hydrate) => set({ hasHydrated: hydrate }),

            registerAdminWithRestaurant: async (formData) => {
                set({ isLoading: true });
                try {
                    const response = await fetch(`${API_URL}/register/restaurant`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.message || 'Erro ao registrar restaurante');
                    }

                    const data = await response.json();
                    const { token, user, restaurant, unit } = data;

                    localStorage.setItem('auth_token', token);

                    set({
                        token,
                        user,
                        restaurant,
                        units: [unit],
                        role: user.role,
                        isAuthenticated: true,
                        isLoading: false
                    });

                    return { success: true, token, restaurant, user };
                } catch (error: any) {
                    console.error('Erro ao registrar restaurante:', error.message);
                    set({ isAuthenticated: false, isLoading: false });
                    return { success: false, message: error.message };
                }
            },

            rehydrate: async () => {
                    set({ isLoading: true });
                    try {
                    const token =
                        typeof window !== 'undefined'
                        ? localStorage.getItem('auth_token')
                        : null;

                    if (!token) {
                        set({ isAuthenticated: false, token: null });
                        return;
                    }

                    const res = await fetch(`${API_URL}/validate`, {
                        method: 'GET',
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (!res.ok) {
                        set({ isAuthenticated: false, token: null });
                        return;
                    }

                    const data = await res.json();
                    
                    set((state) => ({
                        token,
                        user: data.user ?? state.user,
                        role: data.user?.role ?? state.role,
                        restaurant: (data.restaurant ?? state.restaurant) || null,
                        units: Array.isArray(data.units) ? data.units : (state.units ?? []),
                        isAuthenticated: true,
                    }));
                    } catch (err: any) {
                    set({ isAuthenticated: false, token: null });
                    } finally {
                    set({ isLoading: false, hasHydrated: true });
                    }
                },
        }),
        {
            name: 'auth-storage',
            onRehydrateStorage: () => (state) => {
                state?.rehydrate?.().catch(() => state?.setHasHydrated?.(true));
            },
        }
    )
);
