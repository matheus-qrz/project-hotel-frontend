'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useEffect, useState, ReactNode } from 'react';
import { useAuthStore, useRestaurantStore } from '@/stores';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

interface SessionManagerProps {
    children: ReactNode;
}

interface GuestInfo {
    id: string;
    name: string;
    tableId: string;
    restaurantId: string;
    restaurantName: string;
    createdAt: string;
}

export default function SessionManager({ children }: SessionManagerProps) {
    const { data: session, status } = useSession();
    const updateFromSession = useAuthStore(state => state.updateFromSession);
    const fetchRestaurantData = useRestaurantStore(state => state.fetchRestaurantData);

    useEffect(() => {
        if (status === 'authenticated' && session) {
            updateFromSession(session);

            if (session.user?.restaurantId) {
                fetchRestaurantData(session.user.restaurantId);
            }
        }
    }, [session, status, updateFromSession, fetchRestaurantData]);

    return <>{children}</>;
}

export function useAuthCheck() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        token,
        setToken,
        setUserRole,
        setRestaurantId,
        clear: clearAuth
    } = useAuthStore();

    // Verificar e restaurar a sessão do localStorage    
    useEffect(() => {
        const storedSession = localStorage.getItem('user-session');
        const guestToken = localStorage.getItem('guest_token');

        if (storedSession && status === 'unauthenticated' && !guestToken) {
            try {
                const sessionData = JSON.parse(storedSession);
                setToken(sessionData.token);
                setUserRole(sessionData.role);
                setRestaurantId(sessionData.restaurantId);
            } catch (error) {
                console.error('Erro ao restaurar sessão:', error);
                localStorage.removeItem('user-session');
            }
        }
    }, [status, setToken, setUserRole, setRestaurantId]);

    const isAuthenticated = status === 'authenticated' && (!!token || !!session?.token);
    const isAdmin = isAuthenticated && session?.user?.role === 'ADMIN';
    const isManager = isAuthenticated && session?.user?.role === 'MANAGER';
    const isAttendant = isAuthenticated && session?.user?.role === 'ATTENDANT';
    const isClient = isAuthenticated && session?.user?.role === 'CLIENT';

    const isAdminOrManager = isAdmin || isManager;
    const isStaff = isAdmin || isManager || isAttendant;

    const registerAdminWithRestaurant = async (payload: any) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/register/restaurant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao registrar restaurante');
            }

            if (data.token) {
                setToken(data.token);
                setUserRole('ADMIN');
            }

            if (data.restaurant?._id) {
                setRestaurantId(data.restaurant._id);
            }

            await signIn('credentials', {
                email: payload.email,
                password: payload.password,
                redirect: false
            });

            return {
                success: true,
                restaurant: data.restaurant,
                token: data.token
            };
        } catch (error: any) {
            setError(error.message || 'Erro ao registrar restaurante');
            return {
                success: false,
                message: error.message
            };
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Credenciais inválidas');
            }

            const sessionData = {
                token: data.token,
                role: data.user?.role || 'CLIENT',
                restaurantId: data.user?.restaurantId || data.restaurant?._id
            };

            localStorage.setItem('user-session', JSON.stringify(sessionData));
            setToken(data.token);
            setUserRole(sessionData.role);
            if (sessionData.restaurantId) {
                setRestaurantId(sessionData.restaurantId);
            }

            await signIn('credentials', {
                email,
                password,
                redirect: false
            });

            return {
                success: true,
                user: data.user,
                restaurant: data.restaurant
            };
        } catch (error: any) {
            setError(error.message || 'Erro ao fazer login');
            return {
                success: false,
                message: error.message
            };
        } finally {
            setIsLoading(false);
        }
    };

    const authenticateAsGuest = async (
        tableId: string,
        restaurantId: string,
        restaurantName: string,
        guestData?: { name: string; }
    ) => {
        setIsLoading(true);
        setError(null);

        try {
            const guestInfo: GuestInfo = {
                id: uuidv4(),
                name: guestData?.name || `Mesa ${tableId}`,
                tableId,
                restaurantId,
                restaurantName,
                createdAt: new Date().toISOString()
            };

            const guestToken = btoa(`${guestInfo.id}:${tableId}:${Date.now()}`);

            // Salvar informações do guest
            localStorage.setItem('guest_info', JSON.stringify(guestInfo));
            localStorage.setItem('guest_token', guestToken);

            // Importante: Atualizar o estado do auth store
            setToken(guestToken);
            setUserRole('GUEST');

            // Não limpar a sessão aqui
            // clearAuth();

            return {
                success: true,
                token: guestToken,
                guestInfo
            };
        } catch (error: any) {
            setError('Erro ao autenticar como convidado');
            return {
                success: false,
                error: error.message
            };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await signOut({ redirect: false });
            localStorage.removeItem('user-session');
            localStorage.removeItem('guest_token');
            localStorage.removeItem('guest_info');
            clearAuth();
            router.push('/');
            return { success: true };
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            return { success: false };
        }
    };

    return {
        isAuthenticated,
        isLoading: status === 'loading' || isLoading,
        isAdmin,
        isManager,
        isAttendant,
        isClient,
        isAdminOrManager,
        isStaff,
        role: session?.user?.role,
        session,
        error,
        registerAdminWithRestaurant,
        authenticateAsGuest,
        login,
        logout
    };
}

export function useSyncSession() {
    const { data: session, status } = useSession();
    const updateFromSession = useAuthStore(state => state.updateFromSession);

    return {
        syncSession: () => {
            if (status === 'authenticated' && session) {
                updateFromSession(session);
            }
        },
        status,
        session
    };
}