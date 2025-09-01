"use client";

import { Sidebar } from "@/components/sidebar/SideMenu";
import { useParams } from "next/navigation";
import { useState } from "react";
import { extractIdFromSlug } from "@/utils/slugify";
import { useDashboardStore } from "@/stores/dashboard";
import Header from "@/components/header/Header";
import ChartCard from "@/components/cards/ChartCard";
import InformativeCard from "@/components/cards/InformativeCard";
import { ActionCards } from "@/components/dashboard/ActionCards";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DelayedLoading } from "@/components/loading/DelayedLoading";
import { useAuthStore } from "@/stores";

export default function Dashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const { slug, unitId } = useParams();
  const { isOpen } = useSidebar();
  const { isLoading } = useAuthStore();
  const { fetchDashboardData } = useDashboardStore();

  const restaurantId = slug && extractIdFromSlug(String(slug));

  async function handleRefresh() {
    try {
      setRefreshing(true);
      const scope = unitId ? "unit" : "restaurant";
      const id = unitId ? String(unitId) : String(restaurantId);

      await Promise.all([
        fetchDashboardData(scope as "unit" | "restaurant", id, "financial"),
        fetchDashboardData(scope as "unit" | "restaurant", id, "orders"),
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="static flex h-screen flex-col bg-background">
      <Header />
      <div
        className={cn(
          "flex w-full flex-col transition-all duration-300",
          isOpen ? "ml-64" : "ml-0",
        )}
      >
        <Sidebar />
        <div className="h-screen flex-1 overflow-auto bg-background">
          <div className="mx-auto w-full max-w-7xl bg-background px-6 py-4">
            <section className="mb-8 w-full">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-foreground">
                  Ações rápidas
                </h2>
              </div>
              <ActionCards />
            </section>
            <div className="mb-5 border-b border-border" />
            <section className="w-full">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-foreground">
                    Resumo diário
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    Um resumo rápido de todas suas unidades no dia de hoje.
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="h-9 w-9 rounded-md border-border bg-background hover:bg-muted"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  aria-label="Atualizar resumo"
                >
                  <RefreshCcw
                    size={20}
                    className={cn(
                      "text-foreground",
                      refreshing && "animate-spin",
                    )}
                  />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard />
                <InformativeCard />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
