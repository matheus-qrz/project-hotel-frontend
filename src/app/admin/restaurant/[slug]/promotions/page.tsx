// app/restaurant/[restaurantId]/units/[unitId]/employees/page.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/header/Header";
import { Sidebar } from "@/components/sidebar/SideMenu";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { DelayedLoading } from "@/components/loading/DelayedLoading";
import PromotionsPage from "@/components/promotion/PromotionsPage";
import { useAuthStore } from "@/stores";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function PromotionsManagementPage() {
  const { slug } = useParams();
  const { isLoading } = useAuthStore();
  const { isOpen } = useSidebar();
  const router = useRouter();

  const { data: session, status } = useSession();
  const token = (session as any)?.token as string | undefined;

  if (!token || status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (isLoading) {
    return <DelayedLoading />;
  }

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

        <div className="w-full flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl px-6 py-4">
            <div className="flex items-center justify-between gap-3 py-6">
              <div className="flex flex-row items-center gap-5">
                <Button
                  onClick={() => window.history.back()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/70 text-zinc-700 shadow-sm backdrop-blur transition hover:bg-white"
                  aria-label="Voltar"
                  title="Voltar"
                >
                  <ChevronLeft size={18} />
                </Button>
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
                  Promoções
                </h1>
              </div>

              <div className="flex flex-row items-center justify-center">
                <Button
                  onClick={() =>
                    router.push(`/admin/restaurant/${slug}/promotions/history`)
                  }
                >
                  Histórico de Promoções
                </Button>
              </div>
            </div>
            <div className="mt-1">
              <PromotionsPage />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
