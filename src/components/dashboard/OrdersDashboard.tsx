import React, { useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useDashboardStore } from "@/stores/dashboard";
import { useRestaurantUnitStore } from "@/stores/restaurantUnit";
import { TopOrder } from "@/types/dashboard";

export function OrdersDashboard() {
  const { data, fetchDashboardData, isLoading } = useDashboardStore();
  const unitId = useRestaurantUnitStore.getState().currentUnitId;

  useEffect(() => {
    if (unitId) {
      fetchDashboardData("unit", unitId, "orders");
    }
  }, [unitId, fetchDashboardData]);

  const summary = data.orders.summary;
  const topOrders = data.orders?.topOrders || [];

  // 👉 Ordena do maior para o menor e calcula % de participação
  const sortedTop = useMemo(() => {
    const arr = [...topOrders].sort(
      (a, b) => (b?.value ?? 0) - (a?.value ?? 0),
    );
    const total = arr.reduce((acc, it) => acc + (it?.value ?? 0), 0) || 1;
    return arr.map((it) => ({
      ...it,
      share: Math.round(((it?.value ?? 0) / total) * 100),
    }));
  }, [topOrders]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Resumo de Pedidos</h2>

      {isLoading && <p>Carregando...</p>}

      {!isLoading && data.orders && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <p className="text-sm text-gray-500">Em andamento</p>
            <p className="text-xl font-semibold">{summary.added}</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-gray-500">Concluídos</p>
            <p className="text-xl font-semibold">{summary.completed}</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-gray-500">Cancelados</p>
            <p className="text-xl font-semibold">{summary.cancelled}</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-gray-500">Ticket médio</p>
            <p className="text-xl font-semibold">R$ {summary.avgTicket}</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-gray-500">Tempo médio (min)</p>
            <p className="text-xl font-semibold">{summary.avgTime}</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-gray-500">Taxa de conversão</p>
            <p className="text-xl font-semibold">{summary.conversionRate}%</p>
          </Card>
        </div>
      )}

      {/* 👉 Itens mais pedidos — LISTA ORDENADA */}
      {!isLoading && sortedTop.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-800">
            Itens mais pedidos
          </h3>

          <Card className="p-2">
            <ol className="divide-y divide-gray-100">
              {sortedTop.map(
                (item: TopOrder & { share: number }, idx: number) => (
                  <li
                    key={`${item.name}-${idx}`}
                    className="flex items-center gap-3 p-3"
                  >
                    <span className="w-7 text-center font-semibold text-gray-700">
                      {idx + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-sm text-gray-700">
                          {item.name}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {item.value} pedidos
                        </span>
                      </div>

                      {/* Barrinha de participação (opcional, mas ajuda a leitura) */}
                      <div className="mt-2 h-2 w-full rounded bg-gray-100">
                        <div
                          className="h-2 rounded bg-emerald-500"
                          style={{ width: `${item.share}%` }}
                          aria-hidden
                        />
                      </div>
                    </div>

                    <span className="w-10 text-right text-xs text-gray-500">
                      {item.share}%
                    </span>
                  </li>
                ),
              )}
            </ol>
          </Card>
        </div>
      )}
    </div>
  );
}
