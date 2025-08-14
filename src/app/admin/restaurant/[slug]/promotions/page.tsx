// app/restaurant/[restaurantId]/units/[unitId]/employees/page.tsx
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/header/Header';
import { Sidebar } from '@/components/dashboard/SideMenu';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuthCheck } from '@/hooks/sessionManager';
import { cn } from '@/lib/utils';
import { DelayedLoading } from '@/components/loading/DelayedLoading';
import { extractIdFromSlug } from '@/utils/slugify';
import PromotionsPage from '@/components/promotion/PromotionsPage';

export default function PromotionsManagementPage() {
    const router = useRouter();
    const { slug } = useParams();
    const { isAuthenticated, isLoading, isAdminOrManager } = useAuthCheck();
    const { isOpen } = useSidebar();

    const restaurantId = extractIdFromSlug(String(slug)) as string;

    if (isLoading) {
        return <DelayedLoading />;
    }

    if (!isAuthenticated || !isAdminOrManager) {
        router.push('/');
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
                    <div className="w-full mx-auto px-6 py-4">
                        <PromotionsPage />
                    </div>
                </div>
            </div>
        </div>
    );
}