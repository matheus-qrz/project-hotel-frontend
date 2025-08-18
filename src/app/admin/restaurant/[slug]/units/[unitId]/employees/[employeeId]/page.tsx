// Implementação para o componente EmployeeDetailsPage

'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import EmployeeDetails from '@/components/employee/EmployeeDetails';
import { extractIdFromSlug } from '@/utils/slugify';
import { useAuthStore } from '@/stores';


export default function EmployeeDetailsPage() {
    const { slug, employeeId } = useParams();

    const restaurantId = extractIdFromSlug(String(slug))

    const { isLoading } = useAuthStore();



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
        <div className="container mx-auto px-4 py-8">
            <EmployeeDetails unitId={restaurantId} employeeId={String(employeeId)} />
        </div>
    );
}