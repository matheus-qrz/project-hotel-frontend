"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores";
import Header from "@/components/header/Header";
import { Sidebar } from "@/components/dashboard/SideMenu";
import { useSidebar } from "@/components/ui/sidebar";
import { DelayedLoading } from "@/components/loading/DelayedLoading";
import CreatePromotion from "@/components/products/CreatePromotion";
import { useSession } from "next-auth/react";

export default function PromotionPage() {
  const { isLoading } = useAuthStore();
  const router = useRouter();
  const { isOpen } = useSidebar();
  const { data: session, status } = useSession();
  const token = (session as any)?.token as string | undefined;

  if (isLoading) {
    return <DelayedLoading />;
  }

  if (!token || status === "unauthenticated") {
    router.push("/login");
    return null;
  }
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
            <h1 className="text-2xl font-bold">Editar produto</h1>
          </div>

          <CreatePromotion />
        </div>
      </div>
    </div>
  );
}
