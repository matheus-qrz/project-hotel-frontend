"use client";

import { useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Chart } from "@/components/charts";
import { format, addMonths, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRestaurantUnitStore } from "@/stores/restaurantUnit";
import { useDashboardStore } from "@/stores";
import { FinancialDashboardData, RecentSale } from "@/types/dashboard";

// loader leve
const DelayedComponent = dynamic(
  () =>
    import("@/components/loading/LoadingComponent").then(
      (m) => m.LoadingComponent,
    ),
  { loading: () => <p>Loading...</p> },
);

// formatter global
const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// rótulo "jan", "fev"...
const m = (d: Date) => format(d, "MMM", { locale: ptBR }).toLowerCase();

// constroi série dos últimos N meses, preenchendo 0 nos ausentes
function buildLastMonthsSeries(
  source: { month: string; value: number }[],
  monthsCount = 12,
) {
  const start = startOfMonth(subMonths(new Date(), monthsCount - 1));
  const look = new Map(
    source.map((it) => [it.month.toLowerCase().slice(0, 3), it.value]),
  );
  const out: { label: string; value: number; date: Date }[] = [];
  for (let i = 0; i < monthsCount; i++) {
    const d = addMonths(start, i);
    const label = m(d);
    out.push({ label, value: look.get(label) ?? 0, date: d });
  }
  return out;
}

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
  if (error) return <div className="p-3 text-red-500">Erro: {error}</div>;
  if (!financial) return <div className="p-3">Nenhum dado disponível</div>;

  const { summary, monthlyRevenue = [], recentSales } = financial;

  // ---- Derivados (seguro contra NaN/∞) ----
  const revenue = summary.revenue ?? 0;
  const cost = summary.cost ?? 0;
  const profit = summary.profit ?? 0;
  const discounts = summary.discounts ?? 0;

  const previousRevenue =
    (summary as any).previousRevenue ?? // se chegar do backend
    (monthlyRevenue.length >= 2
      ? (monthlyRevenue[monthlyRevenue.length - 2]?.value ?? 0)
      : 0);

  const revenueChangePct =
    previousRevenue > 0
      ? ((revenue - previousRevenue) / previousRevenue) * 100
      : 0;

  const cmvCmoPct = revenue > 0 ? (cost / revenue) * 100 : 0;
  const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;
  const discountRatePct = revenue > 0 ? (discounts / revenue) * 100 : 0;
  const netRevenue = Math.max(revenue - discounts, 0);

  // composição (limita percentuais a 0–100 e evita soma > 100)
  const compCostPct = Math.max(Math.min(cmvCmoPct, 100), 0);
  const compDiscPct = Math.max(Math.min(discountRatePct, 100 - compCostPct), 0);
  const compProfitPct = Math.max(
    Math.min(marginPct, 100 - compCostPct - compDiscPct),
    0,
  );
  const compOtherPct = Math.max(
    100 - compCostPct - compDiscPct - compProfitPct,
    0,
  );

  // ---- Série 12m preenchida ----
  const series = buildLastMonthsSeries(monthlyRevenue, 12);
  const chartData = series.map(({ label, value }) => ({ month: label, value }));
  const rangeLabel = `${format(series[0].date, "MMM yyyy", { locale: ptBR })} — ${format(
    series[series.length - 1].date,
    "MMM yyyy",
    { locale: ptBR },
  )}`;

  // best/worst/avg
  const best = series.reduce((a, b) => (b.value > a.value ? b : a), series[0]);
  const worst = series.reduce((a, b) => (b.value < a.value ? b : a), series[0]);
  const avg = series.reduce((s, x) => s + x.value, 0) / series.length;

  const allZero = chartData.every((d) => d.value === 0);

  return (
    <div className="flex flex-col gap-2 p-3">
      {/* TOP KPIs - 6 cards ocupando a linha inteira */}
      <div className="grid grid-cols-12 gap-2">
        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-4 xl:col-span-2">
          <p className="text-sm text-gray-500">Faturamento</p>
          <p className="text-xl font-semibold text-gray-900">
            {BRL.format(revenue)}
          </p>
          <p
            className={`text-sm ${revenueChangePct >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {revenueChangePct >= 0 ? "+" : ""}
            {revenueChangePct.toFixed(1)}% do último mês
          </p>
        </Card>

        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-4 xl:col-span-2">
          <p className="text-sm text-gray-500">CMV + CMO</p>
          <p className="text-xl font-semibold text-gray-900">
            {cmvCmoPct.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-400">Custo / Receita</p>
        </Card>

        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-4 xl:col-span-2">
          <p className="text-sm text-gray-500">Lucro Operacional</p>
          <p className="text-xl font-semibold text-gray-900">
            {BRL.format(profit)}
          </p>
          <p className="text-sm text-gray-400">
            Margem {marginPct.toFixed(1)}%
          </p>
        </Card>

        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-4 xl:col-span-2">
          <p className="text-sm text-gray-500">Descontos</p>
          <p className="text-xl font-semibold text-gray-900">
            {BRL.format(discounts)}
          </p>
          <p className="text-sm text-gray-400">
            Taxa {discountRatePct.toFixed(1)}%
          </p>
        </Card>

        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-4 xl:col-span-2">
          <p className="text-sm text-gray-500">Receita Líquida</p>
          <p className="text-xl font-semibold text-gray-900">
            {BRL.format(netRevenue)}
          </p>
          <p className="text-sm text-gray-400">Após descontos</p>
        </Card>

        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-4 xl:col-span-2">
          <p className="text-sm text-gray-500">Custo Total</p>
          <p className="text-xl font-semibold text-gray-900">
            {BRL.format(cost)}
          </p>
          <p className="text-sm text-gray-400">Base do CMV+CMO</p>
        </Card>
      </div>

      {/* Estrutura de Receita (preenche aquele espaço em branco) */}
      <Card className="rounded-lg bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Estrutura de Receita
          </h3>
          <p className="text-sm text-gray-500">{rangeLabel}</p>
        </div>

        <div className="mb-2 grid grid-cols-4 gap-2">
          <div className="rounded-md border p-2">
            <p className="text-xs text-gray-500">Custo</p>
            <p className="text-sm font-semibold text-gray-900">
              {BRL.format(cost)} · {compCostPct.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-md border p-2">
            <p className="text-xs text-gray-500">Descontos</p>
            <p className="text-sm font-semibold text-gray-900">
              {BRL.format(discounts)} · {compDiscPct.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-md border p-2">
            <p className="text-xs text-gray-500">Lucro</p>
            <p className="text-sm font-semibold text-gray-900">
              {BRL.format(profit)} · {compProfitPct.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-md border p-2">
            <p className="text-xs text-gray-500">Outros</p>
            <p className="text-sm font-semibold text-gray-900">
              {BRL.format(Math.max(revenue - (cost + discounts + profit), 0))} ·{" "}
              {compOtherPct.toFixed(1)}%
            </p>
          </div>
        </div>
      </Card>

      {/* Gráfico + Vendas Recentes */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-12 xl:col-span-9">
          <Card className="h-full rounded-lg bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">▼</span>
                <h3 className="text-lg font-semibold text-gray-900">
                  Faturamento
                </h3>
              </div>
              <p className="text-sm text-gray-500">{rangeLabel}</p>
            </div>

            <Chart
              data={chartData}
              height={340}
              barColor="#1fc1dd"
              valuePrefix="R$ "
              highlightColor="#e6f32b"
              showValueLabels={!allZero}
              yDomain={allZero ? [0, 1] : "auto"}
            />

            {/* resumo rápido sob o gráfico */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Card className="rounded-lg border bg-white p-3 shadow">
                <p className="text-xs text-gray-500">Melhor mês</p>
                <p className="text-sm font-semibold text-gray-900">
                  {format(best.date, "MMM yyyy", { locale: ptBR })} ·{" "}
                  {BRL.format(best.value)}
                </p>
              </Card>
              <Card className="rounded-lg border bg-white p-3 shadow">
                <p className="text-xs text-gray-500">Pior mês</p>
                <p className="text-sm font-semibold text-gray-900">
                  {format(worst.date, "MMM yyyy", { locale: ptBR })} ·{" "}
                  {BRL.format(worst.value)}
                </p>
              </Card>
              <Card className="rounded-lg border bg-white p-3 shadow">
                <p className="text-xs text-gray-500">Média (12m)</p>
                <p className="text-sm font-semibold text-gray-900">
                  {BRL.format(avg)}
                </p>
              </Card>
            </div>
          </Card>
        </div>

        <div className="col-span-12 xl:col-span-3">
          <Card className="h-full rounded-lg bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Vendas Recentes
            </h3>
            <div className="max-h-[520px] space-y-2 overflow-y-auto">
              {recentSales.map((sale: RecentSale, i: number) => (
                <Card
                  key={i}
                  className="rounded-lg bg-white p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm text-gray-600">
                      {sale.name}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {BRL.format(sale.value)}
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
