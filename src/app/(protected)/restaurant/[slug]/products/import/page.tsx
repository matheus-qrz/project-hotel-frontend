'use client';

import Header from '@/components/header/Header';
import { Sidebar } from '@/components/dashboard/SideMenu';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import ImportProducts from '@/components/products/ImportProducts';

export default function ImportProductsPage() {
    const { isOpen } = useSidebar();

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
                    <ImportProducts />
                </div>
            </div>
        </div>
    );
}