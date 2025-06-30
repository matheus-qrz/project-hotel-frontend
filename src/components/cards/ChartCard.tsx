"use client";

import React, { useEffect } from 'react';
import { CircleDollarSign, TrendingUp } from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Chart } from '../charts';
import { useDashboardStore } from '@/stores';
import { useParams } from 'next/navigation';
import { extractIdFromSlug } from '@/utils/slugify';
import { formatCurrency } from '@/services/restaurant/services';
import { DelayedLoading } from '../loading/DelayedLoading';

export default function ChartCard() {
    const { slug } = useParams();
    const { financial, fetchFinancialData, isLoading, error } = useDashboardStore();
    const restaurantId = slug && extractIdFromSlug(String(slug));

    useEffect(() => {
        if (restaurantId) {
            fetchFinancialData(restaurantId);
        }
    }, [restaurantId, fetchFinancialData]);

    // Calcular variação percentual
    const currentRevenue = financial.revenue;
    const previousRevenue = financial.monthlyRevenue[financial.monthlyRevenue.length - 2]?.value || 0;
    const percentageChange = previousRevenue ?
        ((currentRevenue - previousRevenue) / previousRevenue * 100) :
        0;

    // Formatando dados para o Chart
    const chartData = financial.monthlyRevenue?.map(item => ({
        name: item.month,
        value: item.value
    })) || [];

    if (isLoading) return <DelayedLoading />;
    if (error) return <div>Erro ao carregar dados: {error}</div>;

    return (
        <Card className="overflow-hidden border h-full border-border bg-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500">
                        <CircleDollarSign size={22} color="#FFFFFF" />
                    </div>
                    <CardTitle className="text-base font-medium text-primary">Faturamento</CardTitle>
                </div>
                <button className="text-sm text-gray-500 transition-colors hover:text-primary hover:underline">
                    Ver detalhes
                </button>
            </CardHeader>
            <CardContent className="px-2">
                <div className="flex justify-between items-center p-2 border-y border-border">
                    <div>
                        <p className="text-sm text-gray-500">Em relação ao mês passado</p>
                        <p className={`flex items-center gap-1 font-medium ${percentageChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            <TrendingUp size={16} />
                            {percentageChange.toFixed(1)}%
                        </p>
                    </div>
                    <div className="h-8 border-r border-border"></div>
                    <div>
                        <p className="text-sm text-gray-500 text-right">Receita total</p>
                        <p className="text-green-500 font-medium text-right">
                            {formatCurrency(currentRevenue)}
                        </p>
                    </div>
                </div>
                <div className="p-4">
                    <p className="text-sm font-medium mb-2">Faturamento dos últimos 6 meses</p>
                    <div className="h-56 w-full">
                        <Chart
                            data={chartData}
                            barColor="#14b8a6"
                            highlightColor="#f97316"
                            valuePrefix='R$ '
                            currentMonth={new Date().toLocaleString('pt-BR', { month: 'short' })}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}