// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Session } from 'next-auth';

interface GuestInfo {
    name: string;
    email?: string;
    phone?: string;
}

type RegisterAdminWithHotelPayload = {
  firstName: string;
  lastName: string;
  cpf: string;
  email: string;
  password: string;
  phone?: string;
  name: string;
  description?: string;
  logo?: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contact: {
    phone?: string;
    email?: string;
  };
};

type RegisterAdminWithHotelSuccess = {
  success: true;
  message?: string;
  user: { _id: string; firstName: string; lastName: string; email: string; role: 'ADMIN' | string };
  hotel: { _id: string; name: string; slug: string };
  unit?: { _id: string; name: string };
  token: string;
};

type RegisterAdminWithHotelFail = {
  success: false;
  message: string;
};

type RegisterAdminWithHotelResult =
  | RegisterAdminWithHotelSuccess
  | RegisterAdminWithHotelFail;

interface AuthState {
    hotelId: string | null;
    unitId: string | null;
    token: string | null;
    role: string | null;
    tokenExpiry: number | null;
    isGuest: boolean;
    guestInfo: GuestInfo | null;
    roomNumber: string | null;

    isLoading: boolean;
    setLoading: (v: boolean) => void;
    withLoading: <T>(fn: () => Promise<T>) => Promise<T>;

    hotelSlug: string | null;
    setHotelSlug: (slug: string) => void;

    // Métodos de sessão
    setHotelId: (id: string) => void;
    setUnitId: (id: string) => void;
    setToken: (token: string | null, role?: string | null) => void;
    setUserRole: (role: string) => void;
    updateFromSession: (session: Session | null) => void;
    clear: () => void;
    getHeaders: () => Record<string, string>;
    isTokenExpired: () => boolean;

    // Cadastro de Admin com Hotel
    registerAdminWithHotel: (payload: RegisterAdminWithHotelPayload) => Promise<RegisterAdminWithHotelResult>;

    // Métodos para guest
    setGuestInfo: (info: GuestInfo) => void;
    setRoomNumber: (roomNumber: string) => void;
    createGuestToken: () => string;

    _hydrated: boolean;
    setHydrated: () => void;
}

const SESSION_DURATION = 14 * 60 * 60 * 1000; // 14 horas em milissegundos
const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            hotelId: null,
            hotelSlug: null,
            unitId: null,
            token: null,
            role: null,
            tokenExpiry: null,
            isGuest: false,
            guestInfo: null,
            roomNumber: null,
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

            setHotelId: (id: string) => {
                if (typeof id !== 'string') {
                    console.error('Invalid hotel ID:', id);
                    return;
                }
                set({ hotelId: id });
            },

            setUnitId: (id) => set({ unitId: id }),

            setToken: (token, role) => set({ token, role: role ?? null }),

            setUserRole: (role) => set({ role }),

            updateFromSession: (session) => {
                if (session) {
                    const expiry = Date.now() + SESSION_DURATION;
                    set({
                        hotelId: (session.user as any)?.hotelId || null,
                        hotelSlug: (session.user as any)?.hotelSlug || null, // ✅
                        unitId: (session.user as any)?.unitId || null,
                        token: (session.token as any) || null,
                        role: (session.user as any)?.role || null,
                        tokenExpiry: expiry,
                        isGuest: false,
                    });
                }
            },

            setHotelSlug: (slug) => set({ hotelSlug: slug }),
            
            clear: () => set({
                hotelId: null,
                hotelSlug: null,
                unitId: null,
                token: null,
                role: null,
                tokenExpiry: null,
                isGuest: false,
                guestInfo: null,
                roomNumber: null,
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

            registerAdminWithHotel: async (
                payload: RegisterAdminWithHotelPayload
            ): Promise<RegisterAdminWithHotelResult> => {
                set({ isLoading: true });
                try {
                    const resp = await fetch(`${API_URL}/hotel/create`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });

                    const data = await resp.json().catch(() => ({}));

                    if (!resp.ok) {
                        const message = data?.message || data?.error || 'Erro ao registrar';
                        return { success: false, message };
                    }

                    const { user, hotel, unit, token, message } = data;

                    // Persistir sessão
                    set({
                        token: token ?? null,
                        role: user?.role ?? 'ADMIN',
                        hotelId: hotel?._id ?? null,
                        hotelSlug: hotel?.slug ?? null,
                        unitId: unit?._id ?? null,
                        isGuest: false,
                        guestInfo: null,
                        roomNumber: null,
                    });

                    return { success: true, message, user, hotel, unit, token };
                } catch (e: any) {
                    return { success: false, message: e?.message || 'Erro inesperado ao registrar' };
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
                isGuest: true,
            }),

            setRoomNumber: (roomNumber) => set({ roomNumber }),

            createGuestToken: () => {
                const token = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
                const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
                set({
                    token,
                    tokenExpiry: expiry,
                    isGuest: true,
                });
                return token;
            },
        }),
        {
            name: 'hotel-storage',
            partialize: (state) => ({
                hotelId: state.hotelId,
                hotelSlug: state.hotelSlug,
                unitId: state.unitId,
                token: state.token,
                role: state.role,
                tokenExpiry: state.tokenExpiry,
                isGuest: state.isGuest,
                guestInfo: state.guestInfo,
                roomNumber: state.roomNumber,
            }),
        }
    )
);