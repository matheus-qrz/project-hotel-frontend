import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useDashboardStore } from '@/stores/dashboard';
import { useRestaurantUnitStore } from '@/stores/restaurantUnit';
import { TopOrder } from '@/types/dashboard';

export function OrdersDashboard() {
    const { data, fetchDashboardData, isLoading } = useDashboardStore();
    const unitId = useRestaurantUnitStore.getState().currentUnitId;

    useEffect(() => {
        if (unitId) {
            fetchDashboardData('unit', unitId, 'orders');
        }
    }, [unitId]);

    const summary = data.orders.summary;
    const topOrders = data.orders?.topOrders || [];

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Resumo de Pedidos</h2>

            {isLoading && <p>Carregando...</p>}

            {!isLoading && data.orders && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="p-6">
                        <p className="text-gray-500 text-sm">Em andamento</p>
                        <p className="text-xl font-semibold">{summary.added}</p>
                    </Card>

                    <Card className="p-6">
                        <p className="text-gray-500 text-sm">Concluídos</p>
                        <p className="text-xl font-semibold">{summary.completed}</p>
                    </Card>

                    <Card className="p-6">
                        <p className="text-gray-500 text-sm">Cancelados</p>
                        <p className="text-xl font-semibold">{summary.cancelled}</p>
                    </Card>

                    <Card className="p-6">
                        <p className="text-gray-500 text-sm">Ticket médio</p>
                        <p className="text-xl font-semibold">R$ {summary.avgTicket}</p>
                    </Card>

                    <Card className="p-6">
                        <p className="text-gray-500 text-sm">Tempo médio (min)</p>
                        <p className="text-xl font-semibold">{summary.avgTime}</p>
                    </Card>

                    <Card className="p-6">
                        <p className="text-gray-500 text-sm">Taxa de conversão</p>
                        <p className="text-xl font-semibold">{summary.conversionRate}%</p>
                    </Card>
                </div>
            )}

            {!isLoading && topOrders.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-lg font-medium text-gray-800">Itens mais pedidos</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {topOrders.map((item: TopOrder, index: any) => (
                            <Card key={index} className="bg-white shadow-sm p-6 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 text-sm">{item.name}</span>
                                    <span className="text-gray-900 font-medium">{item.value} pedidos</span>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
