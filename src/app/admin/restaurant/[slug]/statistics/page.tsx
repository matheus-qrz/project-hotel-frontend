// app/restaurant/[restaurantId]/products/page.tsx
"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Header from "@/components/header/Header";
import { Sidebar } from "@/components/dashboard/SideMenu";
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

type DashboardTab = "orders" | "financial" | "customers" | "promotions";

export default function StatisticsDashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("orders");
  const { isLoading } = useAuthStore();
  const router = useRouter();
  const { isOpen } = useSidebar();
  const { slug } = useParams();

  const { data: session, status } = useSession();
  const token = (session as any)?.token as string | undefined;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (status !== "authenticated") {
    router.push("/");
    return null;
  }

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

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <Header />
      <div
        className={cn(
          "flex w-full flex-col transition-all duration-300",
          isOpen ? "ml-64" : "ml-0",
        )}
      >
        <Sidebar />

        <div className="px-8 py-6">
          <div className="mb-6 flex items-center">
            <button
              onClick={() => window.history.back()}
              className="mr-4 text-gray-600"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-4xl font-bold text-black">Dashboard</h1>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as DashboardTab)}
            className="mb-6"
          >
            <TabsList className="border-zinc-800 bg-zinc-900">
              <TabsTrigger
                value="orders"
                className={
                  activeTab === "orders" ? "text-white" : "text-zinc-400"
                }
              >
                Pedidos
              </TabsTrigger>
              <TabsTrigger
                value="financial"
                className={
                  activeTab === "financial" ? "text-white" : "text-zinc-400"
                }
              >
                Financeiro
              </TabsTrigger>
              <TabsTrigger
                value="customers"
                className={
                  activeTab === "customers" ? "text-white" : "text-zinc-400"
                }
              >
                Clientes
              </TabsTrigger>
              <TabsTrigger
                value="promotions"
                className={
                  activeTab === "promotions" ? "text-white" : "text-zinc-400"
                }
              >
                Promoções
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {renderContent()}
        </div>
      </div>
    </div>
  );
}
