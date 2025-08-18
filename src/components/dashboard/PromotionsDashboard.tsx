// components/dashboard/PromotionsDashboard.tsx
'use client';

import { useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Chart, ChartData } from "@/components/charts";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DelayedLoading } from '../loading/DelayedLoading';
import { useDashboardStore, useRestaurantUnitStore } from '@/stores';
import { TopPromotion } from '@/types/dashboard';

export function PromotionsDashboard() {
    const { data, isLoading, error, fetchDashboardData } = useDashboardStore();
    const unitId = useRestaurantUnitStore.getState().currentUnitId;

    useEffect(() => {
        if (unitId) {
            fetchDashboardData('unit', unitId, 'promotions');
        }
    }, [unitId]);

    if (isLoading) {
        <DelayedLoading />
    };
    if (error) return <div className="p-6 text-red-500">Erro: {error}</div>;
    if (!data?.promotions) return <div className="p-6">Nenhum dado disponível</div>;

    const promotions = data.promotions;

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="grid grid-cols-6 gap-4">
                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Promoções ativas</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">{promotions.activePromotions}</p>
                    <p className={`text-sm ${promotions.activePromotions >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {promotions.activePromotions >= 0 ? '+' : ''}{promotions.activePromotions} este mês
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Taxa de Conversão</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">{promotions.conversionRate}%</p>
                    <p className={`text-sm ${promotions.conversionChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {promotions.conversionChange >= 0 ? '+' : ''}{promotions.conversionChange}% este mês
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Desconto Médio</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">{promotions.avgDiscount}%</p>
                    <p className={`text-sm ${promotions.discountChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {promotions.discountChange >= 0 ? '+' : ''}{promotions.discountChange}% este mês
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">ROI Médio</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">{promotions.roi}%</p>
                    <p className={`text-sm ${promotions.roiChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {promotions.roiChange >= 0 ? '+' : ''}{promotions.roiChange}% este mês
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Custo por Aquisição</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">R$ {promotions.cpa.toFixed(2)}</p>
                    <p className={`text-sm ${promotions.cpaChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {promotions.cpaChange >= 0 ? '+' : ''}{promotions.cpaChange}% este mês
                    </p>
                </Card>

                <Card className="bg-white shadow-sm p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Receita Promoções</p>
                    <p className="text-gray-900 text-xl font-semibold mb-1">
                        R$ {promotions.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className={`text-sm ${promotions.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {promotions.revenueChange >= 0 ? '+' : ''}{promotions.revenueChange}% este mês
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
                        <div className='pt-28'>
                            <Chart
                                data={promotions.monthlyUsage.map((item: any) => ({
                                    month: item.month,
                                    value: item.value
                                }))}
                                height={300}
                                barColor="#1fc1dd"
                                valuePrefix=""
                                highlightColor="#e6f32b"
                            />
                        </div>
                    </Card>
                </div>

                <div className="col-span-1">
                    <Card className="bg-white shadow-sm p-6 rounded-lg">
                        <h3 className="text-gray-900 text-lg font-semibold mb-4">Promoções Populares</h3>
                        <div className="space-y-2 max-h-[380px] overflow-y-auto">
                            {promotions.topPromotions.map((promotion: TopPromotion, index: number) => (
                                <Card className="bg-white shadow-sm p-6 rounded-lg">
                                    <div key={index} className="flex items-center justify-between">
                                        <span className="text-gray-500 text-sm truncate">{promotion.name}</span>
                                        <span className="text-gray-900 font-medium">{promotion.totalSold} usos</span>
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