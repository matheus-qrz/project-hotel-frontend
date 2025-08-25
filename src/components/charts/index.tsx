"use client";

import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LabelList,
  Cell,
} from "recharts";
import { useTheme } from "next-themes";

export interface ChartData {
  month: string;
  value: number;
}

interface ReusableChartProps {
  data: ChartData[];
  height?: number | string;
  barColor: string; // Cor principal para todas as barras
  highlightColor?: string; // Cor para destacar (se não fornecida, usa a cor principal)
  showValueLabels?: boolean;
  currentMonth?: string; // Mês atual para destacar (se não fornecido, usa o último mês)
  valuePrefix?: string; // Prefixo para valores (ex: "R$", "")
  highlightIndex?: number; // Índice opcional para destacar uma barra específica
  hideLegend?: boolean; // Opção para esconder a legenda
  yDomain?: [number, number] | "auto";
}

function normalizeMonth(m?: string) {
  if (!m) return "";
  // remove ponto de abreviação (ex.: "ago." -> "ago"), baixa e mantém 3 letras
  return m.toLowerCase().replace(".", "").slice(0, 3);
}

export function Chart({
  data,
  height = 300,
  barColor,
  highlightColor,
  showValueLabels = true,
  currentMonth,
  valuePrefix = "R$",
  highlightIndex,
  yDomain = "auto",
}: ReusableChartProps) {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const current = normalizeMonth(currentMonth);

  let indexToHighlight = data.length - 1; // padrão: última barra

  if (typeof highlightIndex === "number") {
    indexToHighlight = highlightIndex;
  } else if (current) {
    const found = data.findIndex((d) => normalizeMonth(d.month) === current);
    if (found >= 0) indexToHighlight = found;
  }

  const actualHighlightColor = highlightColor || barColor;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-full min-h-[200px] w-full animate-pulse items-center justify-center rounded-md bg-gray-100">
        <span className="text-gray-400">Carregando gráfico...</span>
      </div>
    );
  }

  // Formatador para valores
  const formatValue = (value: number) =>
    valuePrefix === "R$"
      ? `${valuePrefix} ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `${valuePrefix}${value}`;

  // Obtém o valor máximo para configurar o domínio
  const maxValue = Math.max(...data.map((item) => item.value || 0));

  const values = data.map((d) => Number(d.value || 0));
  const max = Math.max(0, ...values);
  const domain: [number, number] =
    yDomain === "auto" ? [0, max === 0 ? 1 : Math.ceil(max * 1.1)] : yDomain;

  const hasData = max > 0;

  // Define a cor do texto baseada no tema
  const textColor = isDarkTheme ? "#FAFAFA" : "#171717"; // Usando valores do tema
  const tooltipTextColor = isDarkTheme ? "#3F3F46" : "#e2e8f0";

  return (
    <div className="w-full">
      <div
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 10,
              left: 10,
              bottom: 75,
            }}
          >
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              dy={10}
              fontSize={12}
              tick={{ fill: textColor }} // Usando a cor baseada no tema
            />
            <YAxis
              hide
              domain={domain}
            />
            <Tooltip
              formatter={(value) => [formatValue(value as number), ""]}
              labelFormatter={(name) => `${name}`}
              contentStyle={{
                backgroundColor: "#fff",
                border: `1px solid ${isDarkTheme ? "#3F3F46" : "#e2e8f0"}`,
                borderRadius: "0.375rem",
                padding: "0.5rem",
                color: tooltipTextColor,
              }}
            />
            <Bar
              dataKey="value"
              radius={[6, 6, 0, 0]}
              barSize={56}
              minPointSize={hasData ? 0 : 2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    index === indexToHighlight ? actualHighlightColor : barColor
                  }
                />
              ))}
              <LabelList
                dataKey="value"
                position="top"
                formatter={(value: number) => formatValue(value)}
                style={{ fontSize: "12px", fill: textColor }} // Usando a cor baseada no tema
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
