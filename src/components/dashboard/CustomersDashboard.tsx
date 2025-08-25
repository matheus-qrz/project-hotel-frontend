"use client";

import { useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Chart } from "@/components/charts";
import { format, addMonths, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDashboardStore } from "@/stores/dashboard";
import { useRestaurantUnitStore } from "@/stores/restaurantUnit";
import type {
  CustomersDashboardData,
  CustomersSummary,
  TopCustomer,
} from "@/types/dashboard";

const DelayedComponent = dynamic(
  () =>
    import("@/components/loading/LoadingComponent").then(
      (mod) => mod.LoadingComponent,
    ),
  { loading: () => <p>Loading...</p> },
);

// Intl global (evita hooks)
const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// rótulo curto "jan", "fev"...
const m = (d: Date) => format(d, "MMM", { locale: ptBR }).toLowerCase();

// Constrói os últimos N meses e preenche ausentes com 0
function buildLastMonthsSeries(
  source: { month: string; count: number }[] = [],
  monthsCount = 12,
) {
  const start = startOfMonth(subMonths(new Date(), monthsCount - 1));
  const look = new Map(
    source.map((it) => [
      String(it.month).toLowerCase().slice(0, 3),
      Number(it.count) || 0,
    ]),
  );

  const out: { label: string; value: number; date: Date }[] = [];
  for (let i = 0; i < monthsCount; i++) {
    const d = addMonths(start, i);
    const label = m(d);
    out.push({ label, value: look.get(label) ?? 0, date: d });
  }
  return out;
}

export function CustomersDashboard() {
  const { data, isLoading, error, fetchDashboardData } = useDashboardStore();
  const unitId = useRestaurantUnitStore.getState().currentUnitId;

  useEffect(() => {
    if (unitId) fetchDashboardData("unit", unitId, "customers");
  }, [unitId, fetchDashboardData]);

  if (isLoading) {
    return (
      <Suspense>
        <DelayedComponent />
      </Suspense>
    );
  }

  if (error) return <div className="p-3 text-red-500">Erro: {error}</div>;
  if (!data?.customers)
    return <div className="p-3">Nenhum dado disponível</div>;

  const { summary, customerReport, topCustomers } =
    data.customers as CustomersDashboardData;

  // --- KPIs (defensivo contra NaN) ---
  const s: CustomersSummary = summary as CustomersSummary;

  const total = Number(s.total ?? 0);
  const totalChange = Number(s.totalChange ?? 0);

  const newCustomers = Number(s.new ?? 0);
  const newChange = Number(s.newChange ?? 0);

  const retention = Number(s.retention ?? 0);
  const retentionChange = Number(s.retentionChange ?? 0);

  const avgTicket = Number(s.avgTicket ?? 0);
  const avgTicketChange = Number(s.avgTicketChange ?? 0);

  const frequency = Number(s.frequency ?? 0);
  const frequencyChange = Number(s.frequencyChange ?? 0);

  const nps = Number(s.nps ?? 0);
  const npsChange = Number(s.npsChange ?? 0);

  // --- Composição Novos x Recorrentes ---
  const returningCount = Math.max(total - newCustomers, 0);
  const baseComp = Math.max(total, newCustomers + returningCount, 1);
  const pctNew = Math.max(Math.min((newCustomers / baseComp) * 100, 100), 0);
  const pctRet = Math.max(
    Math.min((returningCount / baseComp) * 100, 100 - pctNew),
    0,
  );

  // --- Série 12m preenchida ---
  const series = buildLastMonthsSeries(customerReport?.monthly ?? [], 12);
  const chartData = series.map(({ label, value }) => ({ month: label, value }));
  const rangeLabel = `${format(series[0].date, "MMM yyyy", { locale: ptBR })} — ${format(
    series[series.length - 1].date,
    "MMM yyyy",
    { locale: ptBR },
  )}`;

  // --- Top clientes ordenados + participação ---
  const sortedTop = [...(topCustomers ?? [])].sort(
    (a, b) => (b?.value ?? 0) - (a?.value ?? 0),
  );
  const topTotal =
    sortedTop.reduce((acc, it) => acc + (it?.value ?? 0), 0) || 1;
  const topWithShare = sortedTop.map((it) => ({
    ...it,
    share: Math.round(((it.value ?? 0) / topTotal) * 100),
  }));

  const allZero = chartData.every((d) => d.value === 0);

  return (
    <div className="flex flex-col gap-2 p-3">
      {/* KPIs (mesmo padrão dos outros dashboards) */}
      <div className="grid grid-cols-12 gap-2">
        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-4 xl:col-span-2">
          <p className="text-sm text-gray-500">Total de Clientes</p>
          <p className="text-xl font-semibold text-gray-900">{total}</p>
          <p
            className={`text-sm ${totalChange >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {totalChange >= 0 ? "+" : ""}
            {totalChange}% este mês
          </p>
        </Card>

        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-4 xl:col-span-2">
          <p className="text-sm text-gray-500">Novos Clientes</p>
          <p className="text-xl font-semibold text-gray-900">{newCustomers}</p>
          <p
            className={`text-sm ${newChange >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {newChange >= 0 ? "+" : ""}
            {newChange}% este mês
          </p>
        </Card>

        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-4 xl:col-span-2">
          <p className="text-sm text-gray-500">Retenção</p>
          <p className="text-xl font-semibold text-gray-900">{retention}%</p>
          <p
            className={`text-sm ${retentionChange >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {retentionChange >= 0 ? "+" : ""}
            {retentionChange}% este mês
          </p>
        </Card>

        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-4 xl:col-span-2">
          <p className="text-sm text-gray-500">Ticket Médio</p>
          <p className="text-xl font-semibold text-gray-900">
            {BRL.format(avgTicket)}
          </p>
          <p
            className={`text-sm ${avgTicketChange >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {avgTicketChange >= 0 ? "+" : ""}
            {avgTicketChange}% este mês
          </p>
        </Card>

        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-4 xl:col-span-2">
          <p className="text-sm text-gray-500">Frequência</p>
          <p className="text-xl font-semibold text-gray-900">{frequency}x</p>
          <p
            className={`text-sm ${frequencyChange >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {frequencyChange >= 0 ? "+" : ""}
            {frequencyChange} este mês
          </p>
        </Card>

        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-4 xl:col-span-2">
          <p className="text-sm text-gray-500">NPS</p>
          <p className="text-xl font-semibold text-gray-900">{nps}</p>
          <p
            className={`text-sm ${npsChange >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {npsChange >= 0 ? "+" : ""}
            {npsChange} este mês
          </p>
        </Card>
      </div>

      {/* Estrutura de Clientes — preenche o “espaço em branco” com informação útil */}
      <Card className="rounded-lg bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Estrutura de Clientes
          </h3>
          <p className="text-sm text-gray-500">{rangeLabel}</p>
        </div>

        <div className="mb-2 grid grid-cols-3 gap-2">
          <div className="rounded-md border p-2">
            <p className="text-xs text-gray-500">Novos</p>
            <p className="text-sm font-semibold text-gray-900">
              {newCustomers} · {pctNew.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-md border p-2">
            <p className="text-xs text-gray-500">Recorrentes</p>
            <p className="text-sm font-semibold text-gray-900">
              {returningCount} · {pctRet.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-md border p-2">
            <p className="text-xs text-gray-500">Retenção (taxa)</p>
            <p className="text-sm font-semibold text-gray-900">{retention}%</p>
          </div>
        </div>
      </Card>

      {/* Gráfico + Top Clientes */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-12 xl:col-span-9">
          <Card className="h-full rounded-lg bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">▼</span>
                <h3 className="text-lg font-semibold text-gray-900">
                  Clientes por mês
                </h3>
              </div>
              <p className="text-sm text-gray-500">{rangeLabel}</p>
            </div>
            <div className="flex pt-20">
              <Chart
                data={chartData}
                height={360}
                valuePrefix=""
                barColor="#1fc1dd"
                highlightColor="#e6f32b"
                showValueLabels={!allZero}
                yDomain={allZero ? [0, 1] : "auto"}
              />
            </div>
          </Card>
        </div>

        <div className="col-span-12 xl:col-span-3">
          <Card className="h-full rounded-lg bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Top Clientes
            </h3>
            <div className="max-h-[520px] space-y-2 overflow-y-auto">
              {topWithShare.map(
                (c: TopCustomer & { share: number }, i: number) => (
                  <Card
                    key={`${c.name}-${i}`}
                    className="rounded-lg bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm text-gray-700">
                        {c.name}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {BRL.format(c.value)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded bg-gray-100">
                      <div
                        className="h-2 rounded"
                        style={{ width: `${c.share}%` }}
                      />
                    </div>
                    <div className="mt-1 text-right text-xs text-gray-500">
                      {c.share}%
                    </div>
                  </Card>
                ),
              )}
              {topWithShare.length === 0 && (
                <p className="text-sm text-gray-500">
                  Sem dados de clientes ainda
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
