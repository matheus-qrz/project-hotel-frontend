// app/restaurant/[restaurantId]/units/[unitId]/employees/page.tsx
"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/header/Header";
import { Sidebar } from "@/components/dashboard/SideMenu";
import { useAuthStore, useOrderStore } from "@/stores";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import OrderHistory from "@/components/order/OrderHistory";
import { DelayedLoading } from "@/components/loading/DelayedLoading";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { extractIdFromSlug } from "@/utils/slugify";

export default function OrderHistoryPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isOpen } = useSidebar();
  const { slug, unitId } = useParams();
  const { isLoading } = useAuthStore();
  const { fetchRestaurantUnitOrders } = useOrderStore();
  const router = useRouter();

  const { data: session, status } = useSession();
  const token = (session as any)?.token as string | undefined;

  const restaurantId = slug && extractIdFromSlug(String(slug));

  if (isLoading) {
    return <DelayedLoading />;
  }

  if (!token || status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const handleRefresh = async () => {
    if (!restaurantId) {
      console.log("Faltam parâmetros para atualização:", {
        restaurantId,
        unitId,
      });
      return;
    }

    console.log("Iniciando atualização manual com:", {
      restaurantId,
      unitId,
    });

    try {
      await fetchRestaurantUnitOrders(
        restaurantId,
        unitId ? String(unitId) : "",
      );
      console.log("Atualização concluída");
    } catch (error) {
      console.error("Erro na atualização manual:", error);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col">
      <Header />

      <div
        className={cn(
          "flex w-screen flex-col transition-all duration-300",
          isOpen ? "ml-64" : "ml-0",
        )}
      >
        <Sidebar />

        <div className="w-full flex-1">
          <div className="mx-auto max-w-5xl px-6 py-4">
            <div className="flex flex-row items-center justify-between py-2">
              <div className="flex flex-row items-center justify-center gap-4 p-4">
                <Button
                  onClick={() => window.history.back()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/70 text-zinc-700 shadow-sm backdrop-blur transition hover:bg-white"
                  aria-label="Voltar"
                  title="Voltar"
                >
                  <ChevronLeft size={18} />
                </Button>
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
                  Histórico de Pedidos
                </h1>
              </div>

              <div className="flex items-center justify-center">
                <Button
                  onClick={handleRefresh}
                  className="flex items-center gap-2"
                  variant="outline"
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  {isRefreshing ? "Atualizando..." : "Atualizar Pedidos"}
                </Button>
              </div>
            </div>
            <div className="mt-2">
              <OrderHistory slug={String(slug)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
