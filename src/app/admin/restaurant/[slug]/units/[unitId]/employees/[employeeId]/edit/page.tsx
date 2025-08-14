'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import EmployeeForm from '@/components/employee/EmployeeForm';
import { extractIdFromSlug } from '@/utils/slugify';
import { useAuthStore } from '@/stores/auth';

export function EditEmployeePage() {
    const { slug, employeeId } = useParams();
    const router = useRouter();

    const { user, token } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);

    const restaurantId = slug && extractIdFromSlug(String(slug));
    const isAuthorized = user && user.role === 'ADMIN' || 'MANAGER';

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (!token || !isAuthorized) {
                router.push('/admin/login');
            }
            setIsLoading(false);
        }, 300);

        return () => clearTimeout(timeout);
    }, [token, isAuthorized, router]);

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
            <EmployeeForm
                restaurantId={String(restaurantId)}
                employeeId={String(employeeId)}
                isEditMode={true}
            />
        </div>
    );
}
