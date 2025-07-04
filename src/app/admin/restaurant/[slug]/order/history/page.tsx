// app/restaurant/[restaurantId]/units/[unitId]/employees/page.tsx
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/header/Header';
import { Sidebar } from '@/components/dashboard/SideMenu';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuthCheck } from '@/hooks/sessionManager';
import { cn } from '@/lib/utils';
import OrderHistory from '@/components/order/OrderHistory';
import { DelayedLoading } from '@/components/loading/DelayedLoading';

export default function EmployeesPage() {
    const router = useRouter();
    const { slug } = useParams();
    const { isAuthenticated, isLoading, isAdminOrManager } = useAuthCheck();
    const { isOpen } = useSidebar();

    if (isLoading) {
        return <DelayedLoading />;
    }

    if (!isAuthenticated || !isAdminOrManager) {
        router.push('/login');
        return null;
    }

    return (
        <div className="w-full flex flex-col h-screen">
            <Header />

            <div className={cn(
                "flex flex-col w-screen transition-all duration-300",
                isOpen ? "ml-64" : "ml-0"
            )}>
                <Sidebar />

                <div className="flex-1 w-full overflow-auto">
                    <div className="max-w-5xl mx-auto px-6 py-4">
                        <OrderHistory slug={String(slug)} />
                    </div>
                </div>
            </div>
        </div>
    );
}