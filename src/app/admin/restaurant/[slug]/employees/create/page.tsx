"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { Card, CardContent } from "@/components/ui/card";
import EmployeeForm from "@/components/employee/EmployeeForm";
import { useSidebar } from "@/components/ui/sidebar";
import Header from "@/components/header/Header";
import { Sidebar } from "@/components/dashboard/SideMenu";
import { extractIdFromSlug } from "@/utils/slugify";
import { useSession } from "next-auth/react";
import { DelayedLoading } from "@/components/loading/DelayedLoading";

const CreateEmployeePage: React.FC = () => {
  const { slug } = useParams();
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
    <div className="flex h-screen w-full flex-col overflow-hidden md:overflow-auto">
      <Header />

      <div
        className={cn(
          "flex w-screen flex-col transition-all duration-300",
          isOpen ? "ml-64" : "ml-0",
        )}
      >
        <Sidebar />
        <div className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="w-full max-w-4xl">
            <EmployeeForm
              restaurantId={String(restaurantId)}
              isEditMode={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEmployeePage;
