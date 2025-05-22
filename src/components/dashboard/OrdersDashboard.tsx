// components/dashboard/OrdersDashboard.tsx
'use client';

import { Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card } from "@/components/ui/card";
import { Chart } from "@/components/charts";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMockedDashboardStore } from '@/stores';

const DelayedComponent = dynamic(
    () => import('@/components/loading/LoadingComponent').then(mod => mod.LoadingComponent),
    { loading: () => <p>Loading...</p> }
);

export function OrdersDashboard() {
    const { data, isLoading, error, fetchDashboardData } = useMockedDashboardStore();

    useEffect(() => {
        fetchDashboardData('mock-unit-id', 'orders');
    }, []);

    if (isLoading) {
        <Suspense>
            <DelayedComponent />
        </Suspense>
    };
    if (error) return <div className="p-6 text-red-500">Erro: {error}</div>;
    if (!data?.orders) return <div className="p-6">Nenhum dado disponível</div>;

    const { summary, orderReport, topOrders } = data.orders;

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="grid grid-cols-6 gap-4">
                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Em andamento</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">{summary.inProgress}</p>
                    <p className={`text-sm ${summary.inProgressChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.inProgressChange >= 0 ? '+' : ''}{summary.inProgressChange}% de ontem
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Aprovados</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">{summary.approved}</p>
                    <p className={`text-sm ${summary.approvedChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.approvedChange >= 0 ? '+' : ''}{summary.approvedChange}% de ontem
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Cancelados</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">{summary.cancelled}</p>
                    <p className={`text-sm ${summary.cancelledChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.cancelledChange >= 0 ? '+' : ''}{summary.cancelledChange}% de ontem
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Ticket Médio</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">R$ {summary.avgTicket.toFixed(2)}</p>
                    <p className={`text-sm ${summary.avgTicketChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.avgTicketChange >= 0 ? '+' : ''}{summary.avgTicketChange}% de ontem
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Taxa de Conversão</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">{summary.conversionRate}%</p>
                    <p className={`text-sm ${summary.conversionChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.conversionChange >= 0 ? '+' : ''}{summary.conversionChange}% de ontem
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Tempo Médio</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">{summary.avgTime} min</p>
                    <p className={`text-sm ${summary.avgTimeChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.avgTimeChange >= 0 ? '+' : ''}{summary.avgTimeChange} min de ontem
                    </p>
                </Card>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                    <Card className="bg-white shadow-sm p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-900 text-lg font-semibold">▼</span>
                                <h3 className="text-gray-900 text-lg font-semibold">Pedidos por hora</h3>
                            </div>
                            <p className="text-gray-500 text-sm">
                                {format(new Date(2025, 0, 20), 'MMM dd, yyyy', { locale: ptBR })} -
                                {format(new Date(2025, 3, 15), 'MMM dd, yyyy', { locale: ptBR })}
                            </p>
                        </div>
                        <Chart
                            data={orderReport.monthly}
                            height={300}
                            barColor="#1fc1dd"
                            valuePrefix=""
                            highlightColor="#e6f32b"
                        />
                    </Card>
                </div>

                <div className="col-span-1">
                    <Card className="bg-white shadow-sm p-6 rounded-lg">
                        <h3 className="text-gray-900 text-lg font-semibold mb-4">Mais Pedidos</h3>
                        <div className="space-y-2 max-h-[380px] overflow-y-auto">
                            {topOrders.map((order, index) => (
                                <Card className="bg-white shadow-sm p-6 rounded-lg">
                                    <div key={index} className="flex items-center justify-between">
                                        <span className="text-gray-500 text-sm">{order.name}</span>
                                        <span className="text-gray-900 font-medium">{order.value} pedidos</span>
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
