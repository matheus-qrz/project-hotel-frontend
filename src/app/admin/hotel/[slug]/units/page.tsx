"use client";

import { useEffect } from "react";
import UnitsList from "@/components/units/UnitsList";
import { Sidebar } from "@/components/sidebar/Sidebar";
import Header from "@/components/header/Header";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuthStore, useRestaurantUnitStore } from "@/stores";
import { useParams, useRouter } from "next/navigation";
import { extractIdFromSlug } from "@/utils/slugify";
import { useToast } from "@/hooks/useToast";
import { DelayedLoading } from "@/components/loading/DelayedLoading";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function UnitsPage() {
  const toast = useToast();
  const { isLoading } = useAuthStore();
  const { units = [], fetchUnits } = useRestaurantUnitStore();
  const { slug } = useParams();
  const { isOpen } = useSidebar();
  const { data: session, status } = useSession();
  const token = (session as any)?.token as string | undefined;

  const restaurantId = slug && extractIdFromSlug(String(slug));

  useEffect(() => {
    if (status === "unauthenticated" || !restaurantId) return;

    fetchUnits(restaurantId, String(token)).catch((err) => {
      console.error("Erro ao buscar unidades:", err);
      toast.toast({
        variant: "destructive",
        title: "Acesso negado",
        description:
          "Você precisa estar logado como administrador para criar unidades.",
      });
    });
  }, [status, restaurantId, token, fetchUnits, toast]);

  if (isLoading) {
    return <DelayedLoading />;
  }

  return (
    <div className="static flex h-screen w-dvw flex-col bg-background">
      <Header />
      <div
        className={cn(
          "flex w-full flex-col transition-all duration-300",
          isOpen ? "ml-64" : "ml-0",
        )}
      >
        <Sidebar />
        <div className="w-full flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl px-6 py-6">
            <div className="flex items-center gap-3 p-2">
              <Button
                onClick={() => window.history.back()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/70 text-zinc-700 shadow-sm backdrop-blur transition hover:bg-white"
                aria-label="Voltar"
                title="Voltar"
              >
                <ChevronLeft size={18} />
              </Button>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
                Unidades
              </h1>
            </div>
            <div className="mt-6">
              <UnitsList
                units={units}
                isLoading={isLoading}
                restaurantId={String(restaurantId)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
