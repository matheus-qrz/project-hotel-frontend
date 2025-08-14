// app/restaurant/[restaurantId]/units/[unitId]/employees/page.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import EmployeeList from '@/components/employee/EmployeeList';
import Header from '@/components/header/Header';
import { Sidebar } from '@/components/dashboard/SideMenu';
import { useSidebar } from '@/components/ui/sidebar';
import { DelayedLoading } from '@/components/loading/DelayedLoading';

export default function EmployeesPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuthStore();
    const { isOpen } = useSidebar();

    if (!isAuthenticated) {
        router.push('/');
        return null;
    }

    if (isLoading) {
        return <DelayedLoading />;
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
                    <div className="max-w-5xl mx-auto px-6 py-10">
                        <EmployeeList />
                    </div>
                </div>
            </div>
        </div>
    );
}