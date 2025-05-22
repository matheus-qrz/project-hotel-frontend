// components/dashboard/PromotionsDashboard.tsx
'use client';

import { useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Chart } from "@/components/charts";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMockedDashboardStore } from '@/stores';
import { DelayedLoading } from '../loading/DelayedLoading';

export function PromotionsDashboard() {
    const { data, isLoading, error, fetchDashboardData } = useMockedDashboardStore();

    useEffect(() => {
        fetchDashboardData('mock-unit-id', 'promotions');
    }, []);

    if (isLoading) {
        <DelayedLoading />
    };
    if (error) return <div className="p-6 text-red-500">Erro: {error}</div>;
    if (!data?.promotions) return <div className="p-6">Nenhum dado disponível</div>;

    const { summary, promotionReport, topPromotions } = data.promotions;

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="grid grid-cols-6 gap-4">
                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Promoções ativas</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">{summary.active}</p>
                    <p className={`text-sm ${summary.activeChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.activeChange >= 0 ? '+' : ''}{summary.activeChange} este mês
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Taxa de Conversão</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">{summary.conversionRate}%</p>
                    <p className={`text-sm ${summary.conversionChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.conversionChange >= 0 ? '+' : ''}{summary.conversionChange}% este mês
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Desconto Médio</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">{summary.avgDiscount}%</p>
                    <p className={`text-sm ${summary.discountChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.discountChange >= 0 ? '+' : ''}{summary.discountChange}% este mês
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">ROI Médio</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">{summary.roi}%</p>
                    <p className={`text-sm ${summary.roiChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.roiChange >= 0 ? '+' : ''}{summary.roiChange}% este mês
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Custo por Aquisição</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">R$ {summary.cpa.toFixed(2)}</p>
                    <p className={`text-sm ${summary.cpaChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.cpaChange >= 0 ? '+' : ''}{summary.cpaChange}% este mês
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Receita Promoções</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">
                        R$ {summary.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className={`text-sm ${summary.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.revenueChange >= 0 ? '+' : ''}{summary.revenueChange}% este mês
                    </p>
                </Card>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3 border">
                    <Card className="bg-white shadow-sm p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-900 text-lg font-semibold">▼</span>
                                <h3 className="text-gray-900 text-lg font-semibold">Uso de promoções</h3>
                            </div>
                            <p className="text-gray-500 text-sm">
                                {format(new Date(2025, 0, 20), 'MMM dd, yyyy', { locale: ptBR })} -
                                {format(new Date(2025, 3, 15), 'MMM dd, yyyy', { locale: ptBR })}
                            </p>
                        </div>
                        <Chart
                            data={promotionReport.monthly}
                            height={300}
                            barColor="#1fc1dd"
                            valuePrefix=""
                            highlightColor="#e6f32b"
                        />
                    </Card>
                </div>

                <div className="col-span-1">
                    <Card className="bg-white shadow-sm p-6 rounded-lg">
                        <h3 className="text-gray-900 text-lg font-semibold mb-4">Promoções Populares</h3>
                        <div className="space-y-2 max-h-[380px] overflow-y-auto">
                            {topPromotions.map((promotion, index) => (
                                <Card className="bg-white shadow-sm p-6 rounded-lg">
                                    <div key={index} className="flex items-center justify-between">
                                        <span className="text-gray-500 text-sm truncate">{promotion.name}</span>
                                        <span className="text-gray-900 font-medium">{promotion.value} usos</span>
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