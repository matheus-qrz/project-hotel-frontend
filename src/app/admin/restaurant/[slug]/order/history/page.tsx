// app/restaurant/[restaurantId]/units/[unitId]/employees/page.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/header/Header";
import { Sidebar } from "@/components/dashboard/SideMenu";
import { useAuthStore } from "@/stores";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import OrderHistory from "@/components/order/OrderHistory";
import { DelayedLoading } from "@/components/loading/DelayedLoading";
import { useSession } from "next-auth/react";

export default function OrderHistoryPage() {
  const router = useRouter();
  const { slug } = useParams();
  const { isLoading } = useAuthStore();
  const { isOpen } = useSidebar();

  const { data: session, status } = useSession();

  if (isLoading) {
    return <DelayedLoading />;
  }

  if (status !== "authenticated" || session.user.role === "ATTENDANT") {
    router.push("/");
    return null;
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
          <div className="mx-auto max-w-5xl px-6 py-4">
            <OrderHistory slug={String(slug)} />
          </div>
        </div>
      </div>
    </div>
  );
}
