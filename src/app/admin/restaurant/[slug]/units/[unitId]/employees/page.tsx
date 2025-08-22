// app/restaurant/[restaurantId]/units/[unitId]/employees/page.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import EmployeeList from "@/components/employee/EmployeeList";
import Header from "@/components/header/Header";
import { Sidebar } from "@/components/dashboard/SideMenu";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores";
import { useSession } from "next-auth/react";
import { DelayedLoading } from "@/components/loading/DelayedLoading";

export default function UnitEmployeesFromIdPage() {
  const router = useRouter();
  const { isLoading } = useAuthStore();
  const { isOpen } = useSidebar();

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
    <div className="container mx-auto px-4 py-8">
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
            <EmployeeList />
          </div>
        </div>
      </div>
    </div>
  );
}
