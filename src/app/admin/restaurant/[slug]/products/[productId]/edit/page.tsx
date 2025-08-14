'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores';

import Header from '@/components/header/Header';
import { Sidebar } from '@/components/dashboard/SideMenu';
import { useSidebar } from '@/components/ui/sidebar';
import { DelayedLoading } from '@/components/loading/DelayedLoading';
import EditProduct from '@/components/products/EditProduct';

export default function EditProductsPage() {
    const { isAuthenticated, isLoading } = useAuthStore();
    const router = useRouter();
    const { isOpen } = useSidebar();



    if (isLoading) {
        return <DelayedLoading />;
    }

    if (!isAuthenticated) {
        router.push('/');
        return null;
    }

    return (
        <div className="flex flex-col h-screen bg-background w-full">
            <Header />
            <div className={cn("flex flex-col w-full transition-all duration-300", isOpen ? "ml-64" : "ml-0")}>
                <Sidebar />

                <div className="px-8 py-6">
                    <div className="flex items-center mb-6">
                        <button
                            onClick={() => window.history.back()}
                            className="text-gray-600 mr-4"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <h1 className="text-2xl font-bold">Editar produto</h1>
                    </div>

                    <EditProduct />
                </div>
            </div>
        </div>
    );
}