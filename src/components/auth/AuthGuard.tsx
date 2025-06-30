// components/auth/AuthGuard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthCheck } from '@/hooks/sessionManager';
import { DelayedLoading } from '../loading/DelayedLoading';
import { useAuthStore } from '@/stores';

interface AuthGuardProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    allowedRoles?: string[];
}

export default function AuthGuard({ children, requireAuth = true, allowedRoles = [] }: AuthGuardProps) {
    const { isAuthenticated, isLoading, session } = useAuthCheck();
    const { isTokenExpired, clear } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && requireAuth && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, requireAuth, router]);

    if (isLoading) {
        return <DelayedLoading />;
    }

    if (requireAuth && !isAuthenticated) {
        return null;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(session?.user?.role || '')) {
        router.push('/unauthorized');
        return null;
    }

    return <>{children}</>;
}