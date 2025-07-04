'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import EmployeeForm from '@/components/employee/EmployeeForm';
import { useAuthCheck } from '@/hooks/sessionManager';
import { useSidebar } from '@/components/ui/sidebar';
import Header from '@/components/header/Header';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/dashboard/SideMenu';
import { extractIdFromSlug } from '@/utils/slugify';

const CreateEmployeePage: React.FC = () => {
    const { slug } = useParams();
    const { isAuthenticated, isLoading, isAdminOrManager } = useAuthCheck();
    const { isOpen } = useSidebar();

    const restaurantId = slug && extractIdFromSlug(String(slug));

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded w-full mb-6"></div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-20 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    if (!isAdminOrManager) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardContent className="p-6 text-center">
                        <h2 className="text-xl font-semibold text-red-600 mb-2">Acesso Negado</h2>
                        <p>Você não tem permissão para acessar esta página.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col h-screen">
            <Header />

            <div className={cn(
                "flex flex-col w-screen transition-all duration-300",
                isOpen ? "ml-64" : "ml-0"
            )}>
                <Sidebar />
                <div className='w-full p-10 items-center justify-start'>
                    <EmployeeForm restaurantId={String(restaurantId)} isEditMode={false} />
                </div>
            </div>
        </div>
    );
};

export default CreateEmployeePage; 