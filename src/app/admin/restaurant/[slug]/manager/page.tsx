'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import Header from '@/components/header/Header';
import { Sidebar } from '@/components/dashboard/SideMenu';
import { useSidebar } from '@/components/ui/sidebar';
import { DelayedLoading } from '@/components/loading/DelayedLoading';
import ManagerScreen from '@/components/manager/ManagerScreen';


export default function ManagerPage() {
    const { isAuthenticated, isLoading } = useAuthStore();
    const router = useRouter();
    const { isOpen } = useSidebar();
    const { slug } = useParams();

    useRoleGuard(['MANAGER'], '/login');

    if (isLoading) {
        return <DelayedLoading />;
    }

    if (!isAuthenticated) {
        router.push('/');
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