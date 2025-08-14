'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import EmployeeDetails from '@/components/employee/EmployeeDetails';
import { extractIdFromSlug } from '@/utils/slugify';
import Header from '@/components/header/Header';
import { useAuthStore } from '@/stores';
import { useSidebar } from '@/components/ui/sidebar';
import { Sidebar } from '@/components/dashboard';



export default function EmployeeDetailsPage() {
    const { slug, employeeId } = useParams();
    const { isOpen } = useSidebar();
    const { isLoading } = useAuthStore();

    const restaurantId = extractIdFromSlug(String(slug))



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

    return (
        <>
            <div className="w-full flex flex-col h-screen">
                <Header />

                <div className={cn(
                    "flex flex-col w-screen transition-all duration-300",
                    isOpen ? "ml-64" : "ml-0"
                )}>
                    <Sidebar />

                    <div className="flex-1 w-full overflow-auto">
                        <div className="max-w-5xl mx-auto px-6 py-10">
                            <EmployeeDetails unitId={String(restaurantId)} employeeId={String(employeeId)} />
                        </div>
                    </div>
                </div>
            </div>
         </>
    );
}