// app/restaurant/[restaurantId]/products/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ShoppingBag,
  BarChart2,
  Users,
  Percent,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Header from "@/components/header/Header";
import { Sidebar } from "@/components/sidebar/SideMenu";
import { useSidebar } from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  OrdersDashboard,
  CustomersDashboard,
  PromotionsDashboard,
  FinancialDashboard,
} from "@/components/dashboard";
import { useAuthStore } from "@/stores";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

type DashboardTab = "orders" | "financial" | "customers" | "promotions";

export default function StatisticsDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { isLoading } = useAuthStore();
  const { isOpen } = useSidebar();

  const { data: session, status } = useSession();
  const token = (session as any)?.token as string | undefined;

  // --- type guard das abas
  const isTab = (v: string): v is DashboardTab =>
    ["orders", "financial", "customers", "promotions"].includes(v as any);

  // Lê a aba inicial da URL (se houver)
  const initialTabFromURL = useMemo<DashboardTab>(() => {
    const q = (searchParams.get("tab") || "").toLowerCase();
    return isTab(q) ? (q as DashboardTab) : "orders";
  }, [searchParams]);

  // Usa a aba da URL como estado inicial
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTabFromURL);

  // Mantém as opções (ícones/labels) memorizadas
  const tabs = useMemo(
    () => [
      { value: "orders" as const, label: "Pedidos", icon: ShoppingBag },
      { value: "financial" as const, label: "Financeiro", icon: BarChart2 },
      { value: "customers" as const, label: "Clientes", icon: Users },
      { value: "promotions" as const, label: "Promoções", icon: Percent },
    ],
    [],
  );

  const tabsScrollRef = useRef<HTMLDivElement>(null);

  // --- Route guard: redireciona se não autenticado
  useEffect(() => {
    if (!isLoading && (status === "unauthenticated" || !token)) {
      router.replace("/login");
    }
  }, [isLoading, status, token, router]);

  if (isLoading || status === "loading") {
    return <div className="p-8">Loading...</div>;
  }
  if (!token || status === "unauthenticated") return null;

  // Escreve ?tab=<activeTab> na URL somente se diferente do valor atual
  useEffect(() => {
    const current = (searchParams.get("tab") || "").toLowerCase();
    if (current !== activeTab) {
      const sp = new URLSearchParams(searchParams);
      sp.set("tab", activeTab);
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    }
  }, [activeTab, pathname, router, searchParams]);

  // Atualiza o estado se o usuário mudar a URL (voltar/avançar ou link externo)
  useEffect(() => {
    const q = (searchParams.get("tab") || "").toLowerCase();
    if (isTab(q) && q !== activeTab) {
      setActiveTab(q as DashboardTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // depende só de searchParams para evitar loops

  // atalhos de teclado: Ctrl+←/→ e 1..4
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const idx = tabs.findIndex((t) => t.value === activeTab);
      if (e.ctrlKey && e.key === "ArrowRight") {
        setActiveTab(tabs[(idx + 1) % tabs.length].value);
      } else if (e.ctrlKey && e.key === "ArrowLeft") {
        setActiveTab(tabs[(idx - 1 + tabs.length) % tabs.length].value);
      } else if (/^[1-4]$/.test(e.key)) {
        const i = Number(e.key) - 1;
        if (tabs[i]) setActiveTab(tabs[i].value);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab, tabs]);

  const renderContent = () => {
    switch (activeTab) {
      case "orders":
        return <OrdersDashboard />;
      case "promotions":
        return <PromotionsDashboard />;
      case "financial":
        return <FinancialDashboard />;
      case "customers":
        return <CustomersDashboard />;
      default:
        return null;
    }
  };

  useEffect(() => {
    const active = tabsScrollRef.current?.querySelector<HTMLElement>(
      '[data-state="active"]',
    );
    active?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeTab]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-[radial-gradient(2000px_700px_at_50%_-200px,rgba(31,193,221,0.08),transparent)]">
      <Header />

      <div
        className={cn(
          "flex w-full flex-col transition-all duration-300",
          isOpen ? "ml-64" : "ml-0",
        )}
      >
        <Sidebar />

        <main className="relative px-4 py-4 md:px-8 md:py-6">
          <div className="mb-3 flex items-center justify-between">
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
                Estatísticas
              </h1>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <Button
                className="inline-flex h-9 items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-3 text-sm text-zinc-700 shadow-sm backdrop-blur hover:bg-white"
                disabled
                title="Em breve"
              >
                <Bell
                  size={16}
                  className="opacity-70"
                />
                Alertas
              </Button>
            </div>
          </div>

          {/* Tabs sticky */}
          <div className="sticky top-14 z-30 mb-4">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as DashboardTab)}
              className="max-w-lg"
            >
              {/* wrapper com scroll e fades no mobile */}
              <div className="relative -mx-4 sm:mx-0">
                <div
                  ref={tabsScrollRef}
                  className="no-scrollbar overflow-x-auto scroll-smooth px-4 sm:px-0"
                >
                  <TabsList
                    className={cn(
                      "flex min-w-max flex-nowrap gap-2 rounded-full border border-zinc-200 bg-white/70 p-1 shadow-sm backdrop-blur",
                      "dark:border-zinc-800 dark:bg-zinc-900/70",
                    )}
                  >
                    {tabs.map(({ value, label, icon: Icon }) => (
                      <TabsTrigger
                        key={value}
                        value={value}
                        className={cn(
                          "shrink-0 snap-start",
                          "group relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition",
                          "data-[state=active]:bg-zinc-900 data-[state=active]:text-white",
                          "hover:bg-zinc-100 data-[state=active]:hover:bg-zinc-900/90",
                          "dark:hover:bg-zinc-800 dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-900",
                        )}
                        aria-label={label}
                        title={label}
                      >
                        <Icon
                          size={16}
                          className="opacity-80"
                        />
                        {label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* fades laterais (mobile) */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white/70 to-transparent dark:from-zinc-900/70 sm:hidden" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white/70 to-transparent dark:from-zinc-900/70 sm:hidden" />
              </div>
            </Tabs>
          </div>

          {/* Content frame */}
          <section
            className={cn(
              "mx-auto max-w-[1500px] rounded-2xl border border-zinc-200 bg-white/70 p-4 shadow-sm backdrop-blur md:p-6",
              "dark:border-zinc-800 dark:bg-zinc-900/70",
            )}
          >
            {renderContent()}
          </section>

          {/* Footer sutil */}
          <footer className="mx-auto mt-6 max-w-[1500px] pb-4 text-center text-xs text-zinc-500">
            Use Ctrl + ←/→ ou 1-4 para navegar • Últimos 12 meses exibidos nos
            gráficos
          </footer>
        </main>
      </div>
    </div>
  );
}
