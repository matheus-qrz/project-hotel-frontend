// app/restaurant/[restaurantId]/products/page.tsx
'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useAuthCheck } from '@/hooks/sessionManager';
import { cn } from '@/lib/utils';
import Header from '@/components/header/Header';
import { Sidebar } from '@/components/dashboard/SideMenu';
import { useSidebar } from '@/components/ui/sidebar';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    OrdersDashboard,
    CustomersDashboard,
    PromotionsDashboard,
    FinancialDashboard
} from '@/components/dashboard';

type DashboardTab = 'orders' | 'financial' | 'customers' | 'promotions';

export default function StatisticsDashboardPage() {
    const [activeTab, setActiveTab] = useState<DashboardTab>('orders');
    const { isAuthenticated, isLoading } = useAuthCheck();
    const router = useRouter();
    const { isOpen } = useSidebar();
    const { slug } = useParams();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        router.push('/login');
        return null;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'orders':
                return <OrdersDashboard />;
            case 'promotions':
                return <PromotionsDashboard />;
            case 'financial':
                return <FinancialDashboard />;
            case 'customers':
                return <CustomersDashboard />;
            default:
                return null;
        }
    };

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
                        <h1 className="text-4xl font-bold text-black">Dashboard</h1>
                    </div>

                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DashboardTab)} className="mb-6">
                        <TabsList className="bg-zinc-900 border-zinc-800">
                            <TabsTrigger
                                value="orders"
                                className={activeTab === 'orders' ? 'text-white' : 'text-zinc-400'}
                            >
                                Pedidos
                            </TabsTrigger>
                            <TabsTrigger
                                value="financial"
                                className={activeTab === 'financial' ? 'text-white' : 'text-zinc-400'}
                            >
                                Financeiro
                            </TabsTrigger>
                            <TabsTrigger
                                value="customers"
                                className={activeTab === 'customers' ? 'text-white' : 'text-zinc-400'}
                            >
                                Clientes
                            </TabsTrigger>
                            <TabsTrigger
                                value="promotions"
                                className={activeTab === 'promotions' ? 'text-white' : 'text-zinc-400'}
                            >
                                Promoções
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {renderContent()}
                </div>
            </div>
        </div>
    );
}