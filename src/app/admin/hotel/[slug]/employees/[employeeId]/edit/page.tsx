"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { useSidebar } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import EmployeeForm from "@/components/employee/EmployeeForm";
import { extractIdFromSlug } from "@/utils/slugify";
import { Sidebar } from "@/components/dashboard";
import Header from "@/components/header/Header";
import { DelayedLoading } from "@/components/loading/DelayedLoading";
import { useSession } from "next-auth/react";

export default function EditEmployeePage() {
  const { slug, employeeId } = useParams();
  const { isLoading } = useAuthStore();
  const { isOpen } = useSidebar();
  const router = useRouter();

  const restaurantId = slug && extractIdFromSlug(String(slug));

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
        <div className="w-full items-center justify-start p-10">
          <>
            <EmployeeForm
              restaurantId={String(restaurantId)}
              employeeId={String(employeeId)}
              isEditMode={true}
            />
          </>
        </div>
      </div>
    </div>
  );
}
