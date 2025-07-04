'use client';

import { useEffect } from 'react';
import { AdminLogin } from '@/components/login/AdminLogin';
import { useAuthCheck } from '@/hooks/sessionManager';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { DelayedLoading } from '@/components/loading/DelayedLoading';
import { generateRestaurantSlug } from '@/utils/slugify';

export default function LoginPage() {
    const { isAuthenticated, isAdmin, isManager, isLoading, session } = useAuthCheck();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && isAuthenticated && isAdmin && session?.user?.restaurantId) {
            const slug = generateRestaurantSlug('restaurantName', session.user.restaurantId);
            router.replace(`/admin/restaurant/${slug}/dashboard`);
        } else if (!isLoading && isAuthenticated && isManager && session?.user?.restaurantId) {
            const slug = generateRestaurantSlug('restaurantName', session.user.restaurantId);
            router.replace(`/admin/restaurant/${slug}/manager`);
        }
    }, [isAuthenticated, isAdmin, session, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AdminLogin />;
    }

    return (
        <DelayedLoading />
    );
}