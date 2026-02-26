"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores";
import Header from "@/components/header/Header";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import ProductForm from "@/components/products/ProductsForm";
import { DelayedLoading } from "@/components/loading/DelayedLoading";
import { useSession } from "next-auth/react";

export default function ProductsPage() {
  const { isLoading } = useAuthStore();
  const router = useRouter();
  const { isOpen } = useSidebar();
  const { slug } = useParams();

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
            <h1 className="text-2xl font-bold">Produtos</h1>
          </div>

          <ProductForm slug={String(slug)} />
        </div>
      </div>
    </div>
  );
}
