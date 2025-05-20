// components/dashboard/DashboardLayout.tsx
import { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from 'next/router';

interface DashboardLayoutProps {
    children: ReactNode;
    activeTab: 'orders' | 'financial' | 'customers' | 'promotions';
}

export function DashboardLayout({ children, activeTab }: DashboardLayoutProps) {
    const router = useRouter();

    const handleTabChange = (value: string) => {
        router.push(`/dashboard/${value}`);
    };

    return (
        <div className="p-6 bg-black min-h-screen">
            <h1 className="text-4xl font-bold text-white mb-6">Dashboard</h1>

            <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="mb-6">
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

            {children}
        </div>
    );
}