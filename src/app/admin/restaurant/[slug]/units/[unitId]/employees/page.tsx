// app/restaurant/[restaurantId]/units/[unitId]/employees/page.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import EmployeeList from '@/components/employee/EmployeeList';
import Header from '@/components/header/Header';
import { Sidebar } from '@/components/dashboard/SideMenu';
import { useSidebar } from '@/components/ui/sidebar';
import { extractIdFromSlug } from '@/utils/slugify';
import { useAuthStore } from '@/stores';


export default function EmployeesFromIdPage() {
    const router = useRouter();
    const { slug } = useParams();
    const { isAuthenticated, isLoading } = useAuthStore();
    const { isOpen } = useSidebar();

    const restaraurantId = slug && extractIdFromSlug(String(slug));



    if (isLoading) {
        return <div>Loading...</div>; // Ou algum componente de carregamento
    }

    if (!isAuthenticated) {
        router.push('/');
        return null; // Evita renderizar o componente até o redirecionamento
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Header />

            <div className={cn(
                "flex flex-col w-screen transition-all duration-300",
                isOpen ? "ml-64" : "ml-0"
            )}>
                <Sidebar />

                <div className="flex-1 w-full overflow-auto">
                    <div className="max-w-5xl mx-auto px-6 py-4">
                        <EmployeeList />
                    </div>
                </div>
            </div>
        </div>
    );
}