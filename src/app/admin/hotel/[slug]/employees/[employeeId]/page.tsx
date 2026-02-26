"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import EmployeeDetails from "@/components/employee/EmployeeDetails";
import { extractIdFromSlug } from "@/utils/slugify";
import Header from "@/components/header/Header";
import { useAuthStore } from "@/stores";
import { useSidebar } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/dashboard";
import { DelayedLoading } from "@/components/loading/DelayedLoading";

export default function EmployeeDetailsPage() {
  const { slug, employeeId } = useParams();
  const { isOpen } = useSidebar();
  const { isLoading } = useAuthStore();

  const restaurantId = extractIdFromSlug(String(slug));

  if (isLoading) {
    return <DelayedLoading />;
  }

  return (
    <>
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
            <div className="mx-auto max-w-5xl px-6 py-10">
              <EmployeeDetails
                unitId={String(restaurantId)}
                employeeId={String(employeeId)}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
