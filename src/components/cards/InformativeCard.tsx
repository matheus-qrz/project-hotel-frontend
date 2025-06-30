// InformativeCard.tsx
'use client';

import React, { useEffect } from 'react'
import { ShoppingBag, TrendingUp } from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../ui/card"
import { Chart } from '../charts';
import { useDashboardStore } from '@/stores';
import { extractIdFromSlug } from '@/utils/slugify';
import { useParams } from 'next/navigation';

export default function InformativeCard() {
    const { slug } = useParams();
    const { orders, fetchOrdersData } = useDashboardStore();
    const restaurantId = slug && extractIdFromSlug(String(slug));

    useEffect(() => {
        if (restaurantId) {
            fetchOrdersData(restaurantId);
        }
    }, [restaurantId]);

    // Formatando dados para o formato esperado pelo Chart
    const chartData = orders.ordersByMonth?.map(item => ({
        name: item.month,
        value: item.value
    })) || [];

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
                            {orders.inProgress + orders.approved}
                        </p>
                    </div>
                    <div className="h-8 border-r border-border"></div>
                    <div className="text-center">
                        <p className="text-sm text-gray-500">Cancelados</p>
                        <p className="flex items-center justify-center gap-1 text-red-600 font-medium">
                            <TrendingUp size={16} />
                            {orders.cancelled}
                        </p>
                    </div>
                    <div className="h-8 border-r border-border"></div>
                    <div className="text-center">
                        <p className="text-sm text-gray-500">Em produção</p>
                        <p className="flex items-center justify-center gap-1 text-yellow-600 font-medium">
                            <TrendingUp size={16} />
                            {orders.inProgress}
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
                            valuePrefix=''
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}