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
    Cell
} from "recharts";
import { useTheme } from "next-themes";

export interface ChartData {
    month: string
    value: number;
}

interface ReusableChartProps {
    data: ChartData[];
    height?: number | string;
    barColor: string;         // Cor principal para todas as barras
    highlightColor?: string;  // Cor para destacar (se não fornecida, usa a cor principal)
    currentMonth?: string;    // Mês atual para destacar (se não fornecido, usa o último mês)
    valuePrefix?: string;     // Prefixo para valores (ex: "R$", "")
    highlightIndex?: number;  // Índice opcional para destacar uma barra específica
    hideLegend?: boolean;     // Opção para esconder a legenda
}

export function Chart({
    data,
    height = 300,
    barColor,
    highlightColor,
    currentMonth,
    valuePrefix = "R$",
    highlightIndex,
}: ReusableChartProps) {
    const [mounted, setMounted] = useState(false);
    const { theme } = useTheme();
    const isDarkTheme = theme === "dark";

    // Define o índice da barra a ser destacada
    let indexToHighlight = data.length - 1; // Por padrão destaca a última barra

    // Se um índice específico for fornecido, use-o
    if (highlightIndex !== undefined) {
        indexToHighlight = highlightIndex;
    }

    // Caso contrário, se um mês atual for fornecido, encontre-o nos dados
    else if (currentMonth) {
        const foundIndex = data.findIndex(item => item.month === currentMonth);
        if (foundIndex >= 0) {
            indexToHighlight = foundIndex;
        }
    }

    // Use a cor de destaque fornecida ou use a mesma cor das barras
    const actualHighlightColor = highlightColor || barColor;

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="w-full min-h-[200px] h-full flex items-center justify-center bg-gray-100 animate-pulse rounded-md">
                <span className="text-gray-400">Carregando gráfico...</span>
            </div>
        );
    }

    // Formatador para valores
    const formatValue = (value: number) => {
        if (valuePrefix === "R$") {
            // Formato monetário
            return `${valuePrefix} ${value.toFixed(2)}`.replace('.', ',');
        }
        // Formato numérico simples
        return `${valuePrefix}${value}`;
    };

    // Obtém o valor máximo para configurar o domínio
    const maxValue = Math.max(...data.map(item => item.value || 0));

    // Define a cor do texto baseada no tema
    const textColor = isDarkTheme ? "#FAFAFA" : "#171717"; // Usando valores do tema
    const tooltipTextColor = isDarkTheme ? "#3F3F46" : "#e2e8f0";

    return (
        <div className="w-full">
            <div style={{ height: typeof height === 'number' ? `${height}px` : height }}>
                <ResponsiveContainer width="100%" height="100%">
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
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                            fontSize={12}
                            tick={{ fill: textColor }} // Usando a cor baseada no tema
                        />
                        <YAxis
                            hide
                            domain={[0, maxValue * 1.1]}
                        />
                        <Tooltip
                            formatter={(value) => [formatValue(value as number), ""]}
                            labelFormatter={(name) => `${name}`}
                            contentStyle={{
                                backgroundColor: "#fff",
                                border: `1px solid ${isDarkTheme ? "#3F3F46" : "#e2e8f0"}`,
                                borderRadius: "0.375rem",
                                padding: "0.5rem",
                                color: tooltipTextColor
                            }}
                        />
                        <Bar
                            dataKey="value"
                            radius={[4, 4, 0, 0]}
                            barSize={56}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={index === indexToHighlight ? actualHighlightColor : barColor}
                                />
                            ))}
                            <LabelList
                                dataKey="value"
                                position="top"
                                formatter={(value: number) => formatValue(value)}
                                style={{ fontSize: '12px', fill: textColor }} // Usando a cor baseada no tema
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}