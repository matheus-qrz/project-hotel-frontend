// components/dashboard/CustomersDashboard.tsx
'use client';

import { useEffect, Suspense } from 'react';
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

export function CustomersDashboard() {
    const { data, isLoading, error, fetchDashboardData } = useMockedDashboardStore();

    useEffect(() => {
        fetchDashboardData('mock-unit-id', 'customers');
    }, []);

    if (isLoading) {
        <Suspense>
            <DelayedComponent />
        </Suspense>
    };
    if (error) return <div className="p-6 text-red-500">Erro: {error}</div>;
    if (!data?.customers) return <div className="p-6">Nenhum dado disponível</div>;

    const { summary, customerReport, topCustomers } = data.customers;

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="grid grid-cols-6 gap-4">
                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Total de Clientes</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">{summary.total}</p>
                    <p className={`text-sm ${summary.totalChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.totalChange >= 0 ? '+' : ''}{summary.totalChange}% este mês
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Novos Clientes</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">{summary.new}</p>
                    <p className={`text-sm ${summary.newChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.newChange >= 0 ? '+' : ''}{summary.newChange}% esta semana
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Taxa de Retenção</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">{summary.retention}%</p>
                    <p className={`text-sm ${summary.retentionChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.retentionChange >= 0 ? '+' : ''}{summary.retentionChange}% este mês
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Ticket Médio</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">R$ {summary.avgTicket.toFixed(2)}</p>
                    <p className={`text-sm ${summary.avgTicketChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.avgTicketChange >= 0 ? '+' : ''}{summary.avgTicketChange}% este mês
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Frequência</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">{summary.frequency}x</p>
                    <p className={`text-sm ${summary.frequencyChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.frequencyChange >= 0 ? '+' : ''}{summary.frequencyChange} este mês
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">NPS</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">{summary.nps}</p>
                    <p className={`text-sm ${summary.npsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.npsChange >= 0 ? '+' : ''}{summary.npsChange} este mês
                    </p>
                </Card>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                    <Card className="bg-white shadow-sm p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-900 text-lg font-semibold">▼</span>
                                <h3 className="text-gray-900 text-lg font-semibold">Novos clientes</h3>
                            </div>
                            <p className="text-gray-500 text-sm">
                                {format(new Date(2025, 0, 20), 'MMM dd, yyyy', { locale: ptBR })} -
                                {format(new Date(2025, 3, 15), 'MMM dd, yyyy', { locale: ptBR })}
                            </p>
                        </div>
                        <Chart
                            data={customerReport.monthly}
                            height={300}
                            barColor="#1fc1dd"
                            valuePrefix=""
                            highlightColor="#e6f32b"
                        />
                    </Card>
                </div>

                <div className="col-span-1">
                    <Card className="bg-white shadow-sm p-6 rounded-lg">
                        <h3 className="text-gray-900 text-lg font-semibold mb-4">Top Clientes</h3>
                        <div className="space-y-2 max-h-[380px] overflow-y-auto">
                            {topCustomers.map((customer, index) => (
                                <Card className="bg-white shadow-sm p-6 rounded-lg">
                                    <div key={index} className="flex items-center justify-between">
                                        <span className="text-gray-500 text-sm">{customer.name}</span>
                                        <span className="text-gray-900 font-medium">
                                            R$ {customer.value.toFixed(2)}
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