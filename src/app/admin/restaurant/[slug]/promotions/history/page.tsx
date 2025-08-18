// app/restaurant/[restaurantId]/units/[unitId]/employees/page.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/header/Header";
import { Sidebar } from "@/components/dashboard/SideMenu";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { DelayedLoading } from "@/components/loading/DelayedLoading";
import { extractIdFromSlug } from "@/utils/slugify";
import PromotionsPage from "@/components/promotion/PromotionsPage";
import PromotionHistory from "@/components/promotion/PromotionHistory";
import { useAuthStore } from "@/stores";

export default function PromotionHistoryPage() {
  const router = useRouter();
  const { slug } = useParams();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { isOpen } = useSidebar();

  const restaurantId = extractIdFromSlug(String(slug));

  if (isLoading) {
    return <DelayedLoading />;
  }

  if (!isAuthenticated) {
    router.push("/");
    return null;
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-x-hidden">
      <Header />

      <div
        className={cn(
          "flex w-screen flex-col transition-all duration-300",
          isOpen ? "ml-64" : "ml-0",
        )}
      >
        <Sidebar />

        <div className="w-full flex-1 overflow-auto">
          <div className="mx-auto w-full px-6 py-4">
            <PromotionHistory restaurantId={restaurantId} />
          </div>
        </div>
      </div>
    </div>
  );
}
