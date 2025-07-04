'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthCheck } from '@/hooks/sessionManager';
import { cn } from '@/lib/utils';
import Header from '@/components/header/Header';
import { Sidebar } from '@/components/dashboard/SideMenu';
import { useSidebar } from '@/components/ui/sidebar';
import { DelayedLoading } from '@/components/loading/DelayedLoading';
import ManagerScreen from '@/components/manager/ManagerScreen';

export default function ManagerPage() {
    const { isAuthenticated, isLoading } = useAuthCheck();
    const router = useRouter();
    const { isOpen } = useSidebar();
    const { slug } = useParams();

    if (isLoading) {
        return <DelayedLoading />;
    }

    if (!isAuthenticated) {
        router.push('/login');
        return null;
    }

    return (
        <div className="flex flex-col h-screen bg-background w-full overflow-y-hidden">
            <Header />
            <div className={cn("flex flex-col w-full transition-all duration-300", isOpen ? "ml-64" : "ml-0")}>
                <Sidebar />

                <div className="px-8 py-6">
                    <ManagerScreen slug={String(slug)} />
                </div>
            </div>
        </div>
    );
}