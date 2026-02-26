"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import Header from "@/components/header/Header";
import { Sidebar } from "@/components/sidebar/Sidebar";
import HotelOrdersPage from "@/components/order/Orders";

export default function HotelDashboardPage() {
  const { isOpen } = useSidebar();

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
          <HotelOrdersPage />
        </div>
      </div>
    </div>
  );
}
