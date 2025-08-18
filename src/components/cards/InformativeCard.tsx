'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ShoppingBag, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Chart } from '../charts';
import { extractIdFromSlug } from '@/utils/slugify';
import { useDashboardStore } from '@/stores';
import { OrdersDashboardData } from '@/types/dashboard';

export default function InformativeCard() {
    const { slug, unitId } = useParams();
    const { data, fetchDashboardData } = useDashboardStore();

    const restaurantId = slug && extractIdFromSlug(String(slug));

    useEffect(() => {
        if (unitId) {
            fetchDashboardData('unit', String(unitId), 'orders');
        } else {
            fetchDashboardData('restaurant', String(restaurantId), 'orders');
        }
    }, []);

    const orders = data.orders as OrdersDashboardData;

    const chartData = orders?.ordersByMonth?.map(item => ({
        month: item.month,
        value: item.value
    })) ?? [];

    return (
        <Card className="overflow-hidden border border-border bg-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500">
                        <ShoppingBag size={22} color="#FFFFFF" />
                    </div>
                    <CardTitle className="text-base font-medium text-primary">Pedidos</CardTitle>
                </div>
                <button className="text-sm text-gray-500 transition-colors hover:text-primary hover:underline">
                    Ver detalhes
                </button>
            </CardHeader>
            <CardContent className="px-2">
                <div className="flex justify-between items-center p-2 border-y border-border">
                    <div className="text-center">
                        <p className="text-sm text-gray-500">Realizados hoje</p>
                        <p className="flex items-center justify-center gap-1 text-green-500 font-medium">
                            <TrendingUp size={16} />
                            {(orders?.summary.inProgress ?? 0) + (orders?.summary.completed ?? 0)}
                        </p>
                    </div>
                    <div className="h-8 border-r border-border"></div>
                    <div className="text-center">
                        <p className="text-sm text-gray-500">Cancelados</p>
                        <p className="flex items-center justify-center gap-1 text-red-600 font-medium">
                            <TrendingUp size={16} />
                            {orders?.summary.cancelled ?? 0}
                        </p>
                    </div>
                    <div className="h-8 border-r border-border"></div>
                    <div className="text-center">
                        <p className="text-sm text-gray-500">Em produção</p>
                        <p className="flex items-center justify-center gap-1 text-yellow-600 font-medium">
                            <TrendingUp size={16} />
                            {orders?.summary.inProgress ?? 0}
                        </p>
                    </div>
                </div>

                <div className="p-4">
                    <p className="text-sm font-medium mb-4">Quantidade de pedidos realizados nos últimos 6 meses</p>
                    <div className="h-56 w-full">
                        <Chart
                            data={chartData}
                            barColor='#274754'
                            highlightColor='#E8C468'
                            currentMonth={new Date().toLocaleString('pt-BR', { month: 'short' })}
                            valuePrefix=""
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
