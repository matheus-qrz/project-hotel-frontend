"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { CircleDollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { extractIdFromSlug, extractScopeFromPathname } from "@/utils/slugify";
import { useDashboardStore } from "@/stores/dashboard";
import { Chart } from "../charts";
import { DelayedLoading } from "../loading/DelayedLoading";
import { formatCurrency } from "@/utils/formatCurrency";
import { MonthlyRevenueEntry } from "@/types/dashboard";

const MONTHS_PT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];
const normalize = (s?: string) =>
  (s ?? "").toLowerCase().replace(".", "").slice(0, 3);

function lastMonths(n: number): string[] {
  const now = new Date();
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const idx = (now.getMonth() - i + 12) % 12;
    out.push(MONTHS_PT[idx]);
  }
  return out;
}

export default function ChartCard() {
  const { slug, unitId } = useParams();
  const scope = extractScopeFromPathname(String(slug));
  const restaurantId = extractIdFromSlug(String(slug));

  const { data, isLoading, error, fetchDashboardData } = useDashboardStore();

  useEffect(() => {
    if (scope) {
      if (unitId) {
        fetchDashboardData("unit", String(unitId), "financial");
      } else {
        fetchDashboardData("restaurant", String(restaurantId), "financial");
      }
    }
  }, []);

  const financial = data.financial;

  const valueMap = new Map(
    (financial?.monthlyRevenue ?? []).map((m: MonthlyRevenueEntry) => [
      normalize(m.month),
      m.value,
    ]),
  );

  const window6 = lastMonths(6);
  const chartData = window6.map((m) => ({
    month: m,
    value: valueMap.get(normalize(m)) ?? 0,
  }));

  // Agora derive os números a partir da janela fixa
  const currentRevenue = chartData.at(-1)?.value ?? 0;
  const previousRevenue = chartData.at(-2)?.value ?? 0;
  const percentageChange = previousRevenue
    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
    : 0;

  // para destacar a barra do mês atual
  const currentMonthAbbr = MONTHS_PT[new Date().getMonth()];

  if (error) return <div>Erro ao carregar dados: {error}</div>;

  return (
    <Card className="h-full overflow-hidden border border-border bg-background">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
            <CircleDollarSign
              size={22}
              color="#FFFFFF"
            />
          </div>
          <CardTitle className="text-base font-medium text-primary">
            Faturamento
          </CardTitle>
        </div>
        <button className="text-sm text-gray-500 transition-colors hover:text-primary hover:underline">
          Ver detalhes
        </button>
      </CardHeader>
      <CardContent className="px-2">
        <div className="flex items-center justify-between border-y border-border p-2">
          <div>
            <p className="text-sm text-gray-500">Em relação ao mês passado</p>
            <p
              className={`flex items-center gap-1 font-medium ${percentageChange >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              <TrendingUp size={16} />
              {percentageChange.toFixed(1)}%
            </p>
          </div>
          <div className="h-8 border-r border-border"></div>
          <div>
            <p className="text-right text-sm text-gray-500">Receita total</p>
            <p className="text-right font-medium text-green-500">
              {formatCurrency(currentRevenue)}
            </p>
          </div>
        </div>
        <div className="p-4">
          <p className="mb-2 text-sm font-medium">
            Faturamento dos últimos 6 meses
          </p>
          <div className="h-56 w-full">
            {isLoading && (
              <div className="bg-background/60 absolute inset-0 z-10 grid place-items-center backdrop-blur-[1px]">
                <DelayedLoading minHeight="100%" />
              </div>
            )}
            <Chart
              data={chartData}
              barColor="#14b8a6"
              highlightColor="#f97316"
              valuePrefix="R$ "
              currentMonth={currentMonthAbbr}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
