// components/dashboard/FinancialDashboard.tsx
'use client';

import { useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Card } from "@/components/ui/card";
import { Chart } from "@/components/charts";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRestaurantUnitStore } from '@/stores/restaurantUnit';
import { useDashboardStore } from '@/stores';
import { RecentSale } from '@/types/dashboard';

const DelayedComponent = dynamic(
    () => import('@/components/loading/LoadingComponent').then(mod => mod.LoadingComponent),
    { loading: () => <p>Loading...</p> }
);

export function FinancialDashboard() {
    const unitId = useRestaurantUnitStore.getState().currentUnitId;
    const { data, isLoading, error, fetchDashboardData } = useDashboardStore();

    useEffect(() => {
        if (unitId) {
            fetchDashboardData('unit', unitId, 'financial');
        }
    }, [unitId]);

    if (isLoading) {
        <Suspense>
            <DelayedComponent />
        </Suspense>
    };
    if (error) return <div className="p-6 text-red-500">Erro: {error}</div>;
    if (!data?.financial) return <div className="p-6">Nenhum dado disponível</div>;

    const { summary, revenueReport, recentSales } = data.financial;

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="grid grid-cols-6 gap-4">
                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Faturamento</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">
                        R$ {summary.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className={`text-sm ${summary.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.revenueChange >= 0 ? '+' : ''}{summary.revenueChange}% do último mês
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Vendas Totais</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">
                        +{summary.totalSales}
                    </p>
                    <p className={`text-sm ${summary.salesChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.salesChange >= 0 ? '+' : ''}{summary.salesChange}% do último mês
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Ticket Médio</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">
                        R$ {summary.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className={`text-sm ${summary.ticketChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.ticketChange >= 0 ? '+' : ''}{summary.ticketChange}% do último mês
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">CMV + CMO</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">
                        {summary.cmvCmo}%
                    </p>
                    <p className={`text-sm ${summary.cmvCmoChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.cmvCmoChange >= 0 ? '+' : ''}{summary.cmvCmoChange}% do último mês
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg justify-start">
                    <p className="text-gray-500 text-sm mb-1">Ponto de equilíbrio</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1 pt-6">
                        R$ {summary.breakEvenPoint.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Lucro Operacional</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1 pt-6">
                        R$ {summary.operationalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </Card>
            </div>

            {/* Charts and Recent Sales */}
            <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                    <Card className="bg-white shadow-sm p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-900 text-lg font-semibold">▼</span>
                                <h3 className="text-gray-900 text-lg font-semibold">Faturamento</h3>
                            </div>
                            <p className="text-gray-500 text-sm">
                                {format(new Date(2025, 0, 20), 'MMM dd, yyyy', { locale: ptBR })} -
                                {format(new Date(2025, 3, 15), 'MMM dd, yyyy', { locale: ptBR })}
                            </p>
                        </div>
                        <div className='pt-28'>
                            <Chart
                                data={revenueReport.monthly}
                                height={300}
                                barColor="#1fc1dd"
                                valuePrefix="R$"
                                highlightColor="#e6f32b"
                            />
                        </div>
                    </Card>
                </div>

                <div className="col-span-1">
                    <Card className="bg-white shadow-sm p-6 rounded-lg">
                        <h3 className="text-gray-900 text-lg font-semibold mb-4">Vendas Recentes</h3>
                        <div className="space-y-2 max-h-[380px] overflow-y-auto">
                            {recentSales.map((sale: RecentSale, index: any) => (
                                <Card className="bg-white shadow-sm p-6 rounded-lg">
                                    <div key={index} className="flex items-center justify-between">
                                        <span className="text-gray-500 text-sm">{sale.name}</span>
                                        <span className="text-gray-900 font-medium">
                                            R$ {sale.value.toFixed(2)}
                                        </span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}