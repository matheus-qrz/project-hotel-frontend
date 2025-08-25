"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Chart } from "@/components/charts";
import { format, addMonths, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDashboardStore } from "@/stores/dashboard";
import { useRestaurantUnitStore } from "@/stores/restaurantUnit";
import type {
  OrdersDashboardData,
  OrderSummary,
  TopOrder,
} from "@/types/dashboard";

// Formatter global (evita hooks e re-renderes desnecessários)
const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
// rótulo curta "jan", "fev"...
const m = (d: Date) => format(d, "MMM", { locale: ptBR }).toLowerCase();

// constroi série dos últimos N meses, completando ausentes com 0
function buildLastMonthsSeries(
  source: { month: string; value: number }[] = [],
  monthsCount = 12,
) {
  const start = startOfMonth(subMonths(new Date(), monthsCount - 1));
  const look = new Map(
    source.map((it) => [
      String(it.month).toLowerCase().slice(0, 3),
      Number(it.value) || 0,
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

export function OrdersDashboard() {
  const { data, fetchDashboardData, isLoading, error } = useDashboardStore();
  const unitId = useRestaurantUnitStore.getState().currentUnitId;

  useEffect(() => {
    if (unitId) fetchDashboardData("unit", unitId, "orders");
  }, [unitId, fetchDashboardData]);

  if (isLoading) return <div className="p-3">Carregando…</div>;
  if (error) return <div className="p-3 text-red-500">Erro: {error}</div>;
  if (!data?.orders) return <div className="p-3">Nenhum dado disponível</div>;

  const { summary, topOrders, ordersByMonth } =
    data.orders as OrdersDashboardData;

  // ---- KPIs defensivos ----
  const s: OrderSummary = summary ?? {};
  const total = Number(s.total ?? 0);
  const inProg = Number(s.inProgress ?? s.added ?? 0); // usa inProgress; se ausente, cai para added
  const completed = Number(s.completed ?? 0);
  const cancelled = Number(s.cancelled ?? 0);
  const paid = Number(s.paid ?? 0);
  const avgTicket = Number(s.avgTicket ?? 0);
  const avgTime = Number(s.avgTime ?? 0);
  const convRate = Number(s.conversionRate ?? 0);

  // ---- Série 12m preenchida ----
  const series = buildLastMonthsSeries(ordersByMonth ?? [], 12);
  const chartData = series.map(({ label, value }) => ({ month: label, value }));
  const rangeLabel = `${format(series[0].date, "MMM yyyy", { locale: ptBR })} — ${format(
    series[series.length - 1].date,
    "MMM yyyy",
    { locale: ptBR },
  )}`;

  // ---- Composição por status (em %) ----
  const base = Math.max(total, inProg + completed + cancelled + paid, 1);
  const clamp = (v: number) => Math.max(Math.min(v, 100), 0);
  let pInProg = clamp((inProg / base) * 100);
  let pCompl = clamp((completed / base) * 100);
  let pCanc = clamp((cancelled / base) * 100);
  let pPaid = clamp((paid / base) * 100);
  // normaliza para não ultrapassar 100%
  const sum = pInProg + pCompl + pCanc + pPaid;
  const k = sum > 100 ? 100 / sum : 1;
  pInProg *= k;
  pCompl *= k;
  pCanc *= k;
  pPaid *= k;

  // ---- Top itens: ordena e calcula participação percentual ----
  const sortedTop = [...(topOrders ?? [])].sort(
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
      {/* KPIs (mesmo padrão do financeiro) */}
      <div className="grid grid-cols-12 gap-2">
        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-3 xl:col-span-2">
          <p className="text-sm text-gray-500">Pedidos (total)</p>
          <p className="text-xl font-semibold text-gray-900">{total}</p>
          <p className="text-sm text-gray-400">Acumulado</p>
        </Card>

        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-3 xl:col-span-2">
          <p className="text-sm text-gray-500">Em andamento</p>
          <p className="text-xl font-semibold text-gray-900">{inProg}</p>
          <p className="text-sm text-gray-400">Ativos no momento</p>
        </Card>

        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-3 xl:col-span-2">
          <p className="text-sm text-gray-500">Concluídos</p>
          <p className="text-xl font-semibold text-gray-900">{completed}</p>
          <p className="text-sm text-gray-400">Finalizados</p>
        </Card>

        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-3 xl:col-span-2">
          <p className="text-sm text-gray-500">Cancelados</p>
          <p className="text-xl font-semibold text-gray-900">{cancelled}</p>
          <p className="text-sm text-gray-400">No período</p>
        </Card>

        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-3 xl:col-span-2">
          <p className="text-sm text-gray-500">Pagos</p>
          <p className="text-xl font-semibold text-gray-900">{paid}</p>
          <p className="text-sm text-gray-400">Checkout concluído</p>
        </Card>

        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-3 xl:col-span-2">
          <p className="text-sm text-gray-500">Tempo médio</p>
          <p className="text-xl font-semibold text-gray-900">{avgTime} min</p>
          <p className="text-sm text-gray-400">abertura → conclusão</p>
        </Card>

        {/* <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-3 xl:col-span-2">
          <p className="text-sm text-gray-500">Conversão</p>
          <p className="text-xl font-semibold text-gray-900">{convRate}%</p>
          <p className="text-sm text-gray-400">checkout / carrinhos</p>
        </Card> */}
      </div>

      {/* Estrutura de Pedidos (barra segmentada) */}
      <Card className="rounded-lg bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Estrutura de Pedidos
          </h3>
          <p className="text-sm text-gray-500">{rangeLabel}</p>
        </div>

        <div className="mb-2 grid grid-cols-4 gap-2">
          <div className="rounded-md border p-2">
            <p className="text-xs text-gray-500">Em andamento</p>
            <p className="text-sm font-semibold text-gray-900">
              {inProg} · {pInProg.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-md border p-2">
            <p className="text-xs text-gray-500">Concluídos</p>
            <p className="text-sm font-semibold text-gray-900">
              {completed} · {pCompl.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-md border p-2">
            <p className="text-xs text-gray-500">Cancelados</p>
            <p className="text-sm font-semibold text-gray-900">
              {cancelled} · {pCanc.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-md border p-2">
            <p className="text-xs text-gray-500">Pagos</p>
            <p className="text-sm font-semibold text-gray-900">
              {paid} · {pPaid.toFixed(1)}%
            </p>
          </div>
        </div>
      </Card>

      {/* Gráfico + Itens mais pedidos */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-12 xl:col-span-9">
          <Card className="h-full rounded-lg bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">▼</span>
                <h3 className="text-lg font-semibold text-gray-900">
                  Pedidos por mês
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
              Itens mais pedidos
            </h3>
            <div className="max-h-[520px] space-y-2 overflow-y-auto">
              {topWithShare.map(
                (item: TopOrder & { share: number }, idx: number) => (
                  <Card
                    key={`${item.name}-${idx}`}
                    className="rounded-lg bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm text-gray-700">
                        {item.name}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {item.value} pedidos
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded bg-gray-100">
                      <div
                        className="h-2 rounded"
                        style={{ width: `${item.share}%` }}
                      />
                    </div>
                    <div className="mt-1 text-right text-xs text-gray-500">
                      {item.share}%
                    </div>
                  </Card>
                ),
              )}
              {topWithShare.length === 0 && (
                <p className="text-sm text-gray-500">
                  Sem dados de itens ainda
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
