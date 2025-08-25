"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Chart } from "@/components/charts";
import { format, addMonths, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DelayedLoading } from "../loading/DelayedLoading";
import { useDashboardStore, useRestaurantUnitStore } from "@/stores";
import type { PromotionsSummary, TopPromotion } from "@/types/dashboard";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// rótulo curto "jan", "fev"...
const m = (d: Date) => format(d, "MMM", { locale: ptBR }).toLowerCase();

// constrói os últimos N meses e preenche ausentes com 0
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

// paleta para os segmentos da estrutura
const SEG_COLORS = [
  "#1fc1dd",
  "#e6f32b",
  "#a78bfa",
  "#fb7185",
  "#34d399",
  "#f59e0b",
  "#60a5fa",
  "#f472b6",
];

type UsageByType = {
  type?: string;
  name?: string;
  uses: number;
  revenue?: number;
};

export function PromotionsDashboard() {
  const { data, isLoading, error, fetchDashboardData } = useDashboardStore();
  const unitId = useRestaurantUnitStore.getState().currentUnitId;

  useEffect(() => {
    if (unitId) fetchDashboardData("unit", unitId, "promotions");
  }, [unitId, fetchDashboardData]);

  if (isLoading) return <DelayedLoading />;
  if (error) return <div className="p-3 text-red-500">Erro: {error}</div>;
  if (!data?.promotions)
    return <div className="p-3">Nenhum dado disponível</div>;

  const {
    activePromotions = 0,
    conversionRate = 0,
    conversionChange = 0,
    avgDiscount = 0,
    discountChange = 0,
    roi = 0,
    roiChange = 0,
    cpa = 0,
    cpaChange = 0,
    revenue = 0,
    revenueChange = 0,
    monthlyUsage = [],
    topPromotions = [],
    // opcional do backend
    usageByType: usageRaw = [],
  } = data.promotions as PromotionsSummary & { usageByType?: UsageByType[] };

  // --- Estrutura por tipo (usos) ---
  const usageByType = (usageRaw as UsageByType[])
    .map((u) => ({
      label: (u.type ?? u.name ?? "").toString(),
      uses: Number(u.uses ?? 0),
      revenue: Number(u.revenue ?? 0),
    }))
    .filter((u) => u.label);

  const totalUsesByType = usageByType.reduce((s, x) => s + x.uses, 0);
  const baseComp = Math.max(totalUsesByType, 1);
  const comp = usageByType.map((u) => ({
    ...u,
    pct: Math.max(Math.min((u.uses / baseComp) * 100, 100), 0),
  }));

  // --- Série 12m garantida ---
  const series = buildLastMonthsSeries(monthlyUsage, 12);
  const chartData = series.map(({ label, value }) => ({ month: label, value }));
  const rangeLabel = `${format(series[0].date, "MMM yyyy", { locale: ptBR })} — ${format(
    series[series.length - 1].date,
    "MMM yyyy",
    { locale: ptBR },
  )}`;

  // resumo rápido
  const best = series.reduce((a, b) => (b.value > a.value ? b : a), series[0]);
  const worst = series.reduce((a, b) => (b.value < a.value ? b : a), series[0]);
  const totalUses = series.reduce((s, x) => s + x.value, 0);
  const avgUses = totalUses / (series.length || 1);

  // top promoções com participação
  const topSorted = [...topPromotions].sort(
    (a, b) => (b?.totalSold ?? 0) - (a?.totalSold ?? 0),
  );
  const topTotal =
    topSorted.reduce((acc, it) => acc + (it?.totalSold ?? 0), 0) || 1;
  const topWithShare = topSorted.map((p) => ({
    ...p,
    share: Math.round(((p.totalSold ?? 0) / topTotal) * 100),
  }));

  // todos os valores do gráfico == 0?
  const allZero = chartData.every((d) => d.value === 0);

  return (
    <div className="flex flex-col gap-2 p-3">
      {/* KPIs */}
      <div className="grid grid-cols-12 gap-2">
        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-4 xl:col-span-2">
          <p className="text-sm text-gray-500">Promoções ativas</p>
          <p className="text-xl font-semibold text-gray-900">
            {activePromotions}
          </p>
          <p
            className={`text-sm ${activePromotions >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {activePromotions >= 0 ? "+" : ""}
            {activePromotions} este mês
          </p>
        </Card>

        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-4 xl:col-span-2">
          <p className="text-sm text-gray-500">Conversão</p>
          <p className="text-xl font-semibold text-gray-900">
            {conversionRate}%
          </p>
          <p
            className={`text-sm ${conversionChange >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {conversionChange >= 0 ? "+" : ""}
            {conversionChange}% este mês
          </p>
        </Card>

        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-4 xl:col-span-2">
          <p className="text-sm text-gray-500">Desconto médio</p>
          <p className="text-xl font-semibold text-gray-900">{avgDiscount}%</p>
          <p
            className={`text-sm ${discountChange >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {discountChange >= 0 ? "+" : ""}
            {discountChange}% este mês
          </p>
        </Card>

        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-4 xl:col-span-2">
          <p className="text-sm text-gray-500">ROI</p>
          <p className="text-xl font-semibold text-gray-900">{roi}%</p>
          <p
            className={`text-sm ${roiChange >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {roiChange >= 0 ? "+" : ""}
            {roiChange}% este mês
          </p>
        </Card>

        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-4 xl:col-span-2">
          <p className="text-sm text-gray-500">CPA</p>
          <p className="text-xl font-semibold text-gray-900">
            {BRL.format(cpa)}
          </p>
          <p
            className={`text-sm ${cpaChange >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {cpaChange >= 0 ? "+" : ""}
            {cpaChange}% este mês
          </p>
        </Card>

        <Card className="col-span-12 rounded-lg bg-white p-3 shadow-sm sm:col-span-6 lg:col-span-4 xl:col-span-2">
          <p className="text-sm text-gray-500">Receita (promoções)</p>
          <p className="text-xl font-semibold text-gray-900">
            {BRL.format(revenue)}
          </p>
          <p
            className={`text-sm ${revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {revenueChange >= 0 ? "+" : ""}
            {revenueChange}% este mês
          </p>
        </Card>
      </div>

      {/* Estrutura de Promoções (por tipo) */}
      <Card className="rounded-lg bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Estrutura de Promoções
          </h3>
          <p className="text-sm text-gray-500">{rangeLabel}</p>
        </div>

        {usageByType.length > 0 ? (
          <>
            {/* métricas por tipo */}
            <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {comp.map((u, idx) => (
                <div
                  key={`${u.label}-${idx}`}
                  className="rounded-md border p-2"
                >
                  <p className="text-xs text-gray-500">{u.label}</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {u.uses} usos · {u.pct.toFixed(1)}%
                  </p>
                  {u.revenue > 0 && (
                    <p className="text-xs text-gray-500">
                      {BRL.format(u.revenue)} de receita
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* barra segmentada */}
            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-100">
              {comp.map((u, idx) => (
                <div
                  key={`seg-${u.label}-${idx}`}
                  className="h-full"
                  style={{
                    width: `${u.pct}%`,
                    backgroundColor: SEG_COLORS[idx % SEG_COLORS.length],
                  }}
                  title={`${u.label}: ${u.pct.toFixed(1)}%`}
                />
              ))}
            </div>

            {/* legenda */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {comp.map((u, idx) => (
                <span
                  key={`leg-${u.label}-${idx}`}
                  className="inline-flex items-center gap-1"
                >
                  <span
                    className="inline-block h-2 w-2 rounded-sm"
                    style={{
                      backgroundColor: SEG_COLORS[idx % SEG_COLORS.length],
                    }}
                  />
                  {u.label}
                </span>
              ))}
            </div>
          </>
        ) : (
          // ------ EMPTY STATE ELEGANTE ------
          <div className="rounded-md border border-dashed bg-gray-50 p-6 text-center">
            {/* ícone simples */}
            <svg
              viewBox="0 0 24 24"
              className="mx-auto mb-2 h-8 w-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M3 3v18h18" />
              <path d="M7 15l3-3 3 2 4-5" />
              <circle
                cx="7"
                cy="15"
                r="0.75"
              />
              <circle
                cx="10"
                cy="12"
                r="0.75"
              />
              <circle
                cx="13"
                cy="14"
                r="0.75"
              />
              <circle
                cx="17"
                cy="9"
                r="0.75"
              />
            </svg>

            <p className="text-sm font-medium text-gray-700">
              Sem dados por tipo de promoção
            </p>
            <p className="mx-auto mt-1 max-w-xl text-xs text-gray-500">
              Assim que o backend enviar <code>usageByType</code>, você verá
              aqui a distribuição de usos por tipo (ex.: <em>Cupom</em>,{" "}
              <em>Combo</em>, <em>Happy hour</em>).
            </p>

            {/* barra placeholder */}
            <div className="mx-auto mt-4 w-full max-w-xl">
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-gray-300"
                  style={{ width: "36%" }}
                />
                <div
                  className="h-full bg-gray-200/90"
                  style={{ width: "24%" }}
                />
                <div
                  className="h-full bg-gray-300/80"
                  style={{ width: "18%" }}
                />
                <div
                  className="h-full bg-gray-200/80"
                  style={{ width: "22%" }}
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-left text-[11px] text-gray-500 sm:grid-cols-4">
                <div className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-sm bg-gray-300" />{" "}
                  Cupom
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-sm bg-gray-200/90" />{" "}
                  Combo
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-sm bg-gray-300/80" />{" "}
                  Happy hour
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-sm bg-gray-200/80" />{" "}
                  Outros
                </div>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                  Como habilitar
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-gray-900 p-3 text-left text-[11px] text-gray-100">{`usageByType: [
  { type: "Cupom", uses: 32, revenue: 590.5 },
  { type: "Combo", uses: 18, revenue: 410 },
  { type: "Happy hour", uses: 9 }
]`}</pre>
              </details>
            </div>
          </div>
        )}
      </Card>

      {/* Gráfico + Top promoções */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-12 xl:col-span-9">
          <Card className="h-full rounded-lg bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">▼</span>
                <h3 className="text-lg font-semibold text-gray-900">
                  Uso de promoções
                </h3>
              </div>
              <p className="text-sm text-gray-500">{rangeLabel}</p>
            </div>

            {!allZero ? (
              <Chart
                data={chartData}
                height={340}
                barColor="#1fc1dd"
                valuePrefix=""
                highlightColor="#e6f32b"
              />
            ) : (
              <div className="flex h-[340px] items-center justify-center">
                <p className="text-sm text-gray-500">Sem dados no período</p>
              </div>
            )}

            {/* resumo rápido */}
            <div className="mt-3 grid grid-cols-4 gap-2">
              <Card className="rounded-lg border bg-white p-3 shadow">
                <p className="text-xs text-gray-500">Maior uso</p>
                <p className="text-sm font-semibold text-gray-900">
                  {format(best.date, "MMM yyyy", { locale: ptBR })} ·{" "}
                  {best.value}
                </p>
              </Card>
              <Card className="rounded-lg border bg-white p-3 shadow">
                <p className="text-xs text-gray-500">Menor uso</p>
                <p className="text-sm font-semibold text-gray-900">
                  {format(worst.date, "MMM yyyy", { locale: ptBR })} ·{" "}
                  {worst.value}
                </p>
              </Card>
              <Card className="rounded-lg border bg-white p-3 shadow">
                <p className="text-xs text-gray-500">Média (12m)</p>
                <p className="text-sm font-semibold text-gray-900">
                  {avgUses.toFixed(1)}
                </p>
              </Card>
              <Card className="rounded-lg border bg-white p-3 shadow">
                <p className="text-xs text-gray-500">Total (12m)</p>
                <p className="text-sm font-semibold text-gray-900">
                  {totalUses}
                </p>
              </Card>
            </div>
          </Card>
        </div>

        <div className="col-span-12 xl:col-span-3">
          <Card className="h-full rounded-lg bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Promoções Populares
            </h3>
            <div className="max-h-[520px] space-y-2 overflow-y-auto">
              {topWithShare.map(
                (p: TopPromotion & { share: number }, i: number) => (
                  <Card
                    key={p.id ?? i}
                    className="rounded-lg bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm text-gray-700">
                        {p.name}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {p.totalSold} usos
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded bg-gray-100">
                      <div
                        className="h-2 rounded"
                        style={{
                          width: `${p.share}%`,
                          backgroundColor: "#1fc1dd",
                        }}
                      />
                    </div>
                    <div className="mt-1 text-right text-xs text-gray-500">
                      {p.share}%
                    </div>
                  </Card>
                ),
              )}
              {topWithShare.length === 0 && (
                <div className="flex h-96 items-center justify-center">
                  <p className="text-sm text-gray-500">Sem dados disponíveis</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
