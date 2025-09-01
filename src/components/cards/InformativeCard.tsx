"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShoppingBag, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Chart } from "../charts";
import { extractIdFromSlug } from "@/utils/slugify";
import { useDashboardStore } from "@/stores";
import { OrdersDashboardData } from "@/types/dashboard";
import { DelayedLoading } from "../loading/DelayedLoading";

export default function InformativeCard() {
  const route = useRouter();
  const { slug, unitId } = useParams();
  const { data, fetchDashboardData, isLoading, error } = useDashboardStore();

  const restaurantId = slug && extractIdFromSlug(String(slug));

  useEffect(() => {
    if (unitId) {
      fetchDashboardData("unit", String(unitId), "orders");
    } else {
      fetchDashboardData("restaurant", String(restaurantId), "orders");
    }
  }, []);

  const orders = data.orders as OrdersDashboardData;

  const chartData =
    orders?.ordersByMonth?.map((item) => ({
      month: item.month,
      value: item.value,
    })) ?? [];

  if (error) return <div>Erro ao carregar dados: {error}</div>;

  return (
    <Card className="overflow-hidden border border-border bg-background">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
            <ShoppingBag
              size={22}
              color="#FFFFFF"
            />
          </div>
          <CardTitle className="text-base font-medium text-primary">
            Pedidos
          </CardTitle>
        </div>
        <button
          className="text-sm text-gray-500 transition-colors hover:text-primary hover:underline"
          onClick={() =>
            route.push(`/admin/restaurant/${slug}/statistics?tab=orders`)
          }
        >
          Ver detalhes
        </button>
      </CardHeader>
      <CardContent className="px-2">
        <div className="flex items-center justify-between border-y border-border p-2">
          <div className="text-center">
            <p className="text-sm text-gray-500">Realizados hoje</p>
            <p className="flex items-center justify-center gap-1 font-medium text-green-500">
              <TrendingUp size={16} />
              {(orders?.summary.inProgress ?? 0) +
                (orders?.summary.completed ?? 0)}
            </p>
          </div>
          <div className="h-8 border-r border-border"></div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Cancelados</p>
            <p className="flex items-center justify-center gap-1 font-medium text-red-600">
              <TrendingUp size={16} />
              {orders?.summary.cancelled ?? 0}
            </p>
          </div>
          <div className="h-8 border-r border-border"></div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Em produção</p>
            <p className="flex items-center justify-center gap-1 font-medium text-yellow-600">
              <TrendingUp size={16} />
              {orders?.summary.inProgress ?? 0}
            </p>
          </div>
        </div>

        <div className="p-4">
          <p className="mb-4 text-sm font-medium">
            Quantidade de pedidos realizados nos últimos 6 meses
          </p>
          <div className="h-56 w-full">
            {isLoading && (
              <div className="bg-background/60 absolute inset-0 z-10 grid place-items-center backdrop-blur-[1px]">
                <DelayedLoading minHeight="100%" />
              </div>
            )}
            <Chart
              data={chartData}
              barColor="#274754"
              highlightColor="#E8C468"
              currentMonth={new Date().toLocaleString("pt-BR", {
                month: "short",
              })}
              valuePrefix=""
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
