// app/restaurant/[restaurantId]/products/page.tsx
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { extractIdFromSlug } from '@/utils/slugify';
import { ChevronLeft } from 'lucide-react';
import { useAuthCheck } from '@/hooks/sessionManager';
import { cn } from '@/lib/utils';
import Header from '@/components/header/Header';
import { Sidebar } from '@/components/dashboard/SideMenu';
import { useSidebar } from '@/components/ui/sidebar';
import ProductsList from '@/components/products/ProductsList';
import { DelayedLoading } from '@/components/loading/DelayedLoading';

export default function ProductsPage() {
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
                        <h1 className="text-2xl font-bold">Produtos</h1>
                    </div>

                    <ProductsList slug={String(slug)} />
                </div>
            </div>
        </div>
    );
}