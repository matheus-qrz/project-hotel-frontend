"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import Header from "@/components/header/Header";
import { Sidebar } from "@/components/dashboard/SideMenu";
import { useSidebar } from "@/components/ui/sidebar";
import { DelayedLoading } from "@/components/loading/DelayedLoading";
import ManagerScreen from "@/components/manager/ManagerScreen";

export default function ManagerPage() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const { isOpen } = useSidebar();
  const { slug } = useParams();

  if (isLoading) {
    return <DelayedLoading />;
  }

  if (!isAuthenticated) {
    router.push("/");
    return null;
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-y-hidden bg-background">
      <Header />
      <div
        className={cn(
          "flex w-full flex-col transition-all duration-300",
          isOpen ? "ml-64" : "ml-0",
        )}
      >
        <Sidebar />

        <div className="px-8 py-6">
          <ManagerScreen slug={String(slug)} />
        </div>
      </div>
    </div>
  );
}
