"use client";

import { useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Chart } from "@/components/charts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRestaurantUnitStore } from "@/stores/restaurantUnit";
import { useDashboardStore } from "@/stores";
import { FinancialDashboardData, RecentSale } from "@/types/dashboard";

const DelayedComponent = dynamic(
  () =>
    import("@/components/loading/LoadingComponent").then(
      (mod) => mod.LoadingComponent,
    ),
  { loading: () => <p>Loading...</p> },
);

export function FinancialDashboard() {
  const unitId = useRestaurantUnitStore.getState().currentUnitId;
  const { data, isLoading, error, fetchDashboardData } = useDashboardStore();

  useEffect(() => {
    if (unitId) fetchDashboardData("unit", unitId, "financial");
  }, [unitId, fetchDashboardData]);

  if (isLoading) {
    return (
      <Suspense>
        <DelayedComponent />
      </Suspense>
    );
  }

  const financial = data?.financial as FinancialDashboardData | undefined;
  if (error) return <div className="p-6 text-red-500">Erro: {error}</div>;
  if (!financial) return <div className="p-6">Nenhum dado disponível</div>;

  const { summary, monthlyRevenue = [], recentSales } = financial;

  // ---- DERIVADOS CALCULADOS NO FRONT ----
  const currentRevenue = summary.revenue ?? 0;

  const prevRevenueFromSeries =
    monthlyRevenue.length >= 2
      ? (monthlyRevenue[monthlyRevenue.length - 2]?.value ?? 0)
      : 0;

  // Permite que o backend envie previousRevenue; se não vier, usamos a série.
  const previousRevenue = summary.previousRevenue ?? prevRevenueFromSeries;

  const revenueChangePct =
    previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

  // CMV + CMO (aqui uso apenas "cost" como proxy; ajuste se tiver CMO separado)
  const cmvCmoPct =
    currentRevenue > 0 ? (summary.cost / currentRevenue) * 100 : 0;

  // Ticket médio (só exibe se o backend enviar salesCount)
  const salesCount = summary.salesCount;
  const averageTicket =
    salesCount && salesCount > 0 ? currentRevenue / salesCount : undefined;

  // Variações (opcionais; só exiba se tiver base)
  const ticketChangePct = undefined as number | undefined; // depende de salesCount anterior
  const cmvCmoChangePct =
    summary.previousCost !== undefined && previousRevenue > 0
      ? cmvCmoPct - (summary.previousCost / previousRevenue) * 100
      : undefined;

  // Dados do gráfico
  const chartData = monthlyRevenue.map((m) => ({
    month: m.month,
    value: m.value,
  }));

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-6 gap-4">
        {/* Faturamento */}
        <Card className="rounded-lg bg-white p-4 shadow-sm">
          <p className="mb-1 text-sm text-gray-500">Faturamento</p>
          <p className="mb-1 text-xl font-semibold text-gray-900">
            R${" "}
            {currentRevenue.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p
            className={`text-sm ${revenueChangePct >= 0 ? "text-green-500" : "text-red-500"}`}
          >
            {revenueChangePct >= 0 ? "+" : ""}
            {revenueChangePct.toFixed(1)}% do último mês
          </p>
        </Card>

        {/* Vendas Totais — só mostra se vier do backend */}
        {typeof salesCount === "number" && (
          <Card className="rounded-lg bg-white p-4 shadow-sm">
            <p className="mb-1 text-sm text-gray-500">Vendas Totais</p>
            <p className="mb-1 text-xl font-semibold text-gray-900">
              +{salesCount}
            </p>
            {false && (
              <p
                className={`text-sm ${0 >= 0 ? "text-green-500" : "text-red-500"}`}
              >
                {/* Placeholder para variação de vendas, quando existir */}
              </p>
            )}
          </Card>
        )}

        {/* Ticket Médio — depende de salesCount */}
        {typeof averageTicket === "number" && (
          <Card className="rounded-lg bg-white p-4 shadow-sm">
            <p className="mb-1 text-sm text-gray-500">Ticket Médio</p>
            <p className="mb-1 text-xl font-semibold text-gray-900">
              R${" "}
              {averageTicket.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
            {typeof ticketChangePct === "number" && (
              <p
                className={`text-sm ${ticketChangePct >= 0 ? "text-green-500" : "text-red-500"}`}
              >
                {ticketChangePct >= 0 ? "+" : ""}
                {ticketChangePct.toFixed(1)}% do último mês
              </p>
            )}
          </Card>
        )}

        {/* CMV + CMO (estimado a partir de cost/revenue) */}
        <Card className="rounded-lg bg-white p-4 shadow-sm">
          <p className="mb-1 text-sm text-gray-500">CMV + CMO</p>
          <p className="mb-1 text-xl font-semibold text-gray-900">
            {cmvCmoPct.toFixed(1)}%
          </p>
          {typeof cmvCmoChangePct === "number" && (
            <p
              className={`text-sm ${cmvCmoChangePct >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              {cmvCmoChangePct >= 0 ? "+" : ""}
              {cmvCmoChangePct.toFixed(1)}% do último mês
            </p>
          )}
        </Card>

        {/* Ponto de equilíbrio — mostra somente se vier do backend */}
        {typeof summary.breakEvenPoint === "number" && (
          <Card className="justify-start rounded-lg bg-white p-4 shadow-sm">
            <p className="mb-1 text-sm text-gray-500">Ponto de equilíbrio</p>
            <p className="mb-1 pt-6 text-xl font-semibold text-gray-900">
              R${" "}
              {summary.breakEvenPoint.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
          </Card>
        )}

        {/* Lucro Operacional (usa summary.profit) */}
        <Card className="rounded-lg bg-white p-4 shadow-sm">
          <p className="mb-1 text-sm text-gray-500">Lucro Operacional</p>
          <p className="mb-1 pt-6 text-xl font-semibold text-gray-900">
            R${" "}
            {summary.profit.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </p>
        </Card>
      </div>

      {/* Charts & Recent Sales */}
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3">
          <Card className="rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">▼</span>
                <h3 className="text-lg font-semibold text-gray-900">
                  Faturamento
                </h3>
              </div>
              <p className="text-sm text-gray-500">
                {format(new Date(), "MMM dd, yyyy", { locale: ptBR })} —
                {format(new Date(), "MMM dd, yyyy", { locale: ptBR })}
              </p>
            </div>

            <div className="pt-6">
              <Chart
                data={chartData}
                height={300}
                barColor="#1fc1dd"
                valuePrefix="R$ "
                highlightColor="#e6f32b"
              />
            </div>
          </Card>
        </div>

        <div className="col-span-1">
          <Card className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Vendas Recentes
            </h3>
            <div className="max-h-[380px] space-y-2 overflow-y-auto">
              {recentSales.map((sale: RecentSale, index: number) => (
                <Card
                  key={index}
                  className="rounded-lg bg-white p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm text-gray-500">
                      {sale.name}
                    </span>
                    <span className="font-medium text-gray-900">
                      R$ {sale.value.toFixed(2)}
                    </span>
                  </div>
                </Card>
              ))}
              {recentSales.length === 0 && (
                <p className="text-sm text-gray-500">Sem vendas recentes</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
