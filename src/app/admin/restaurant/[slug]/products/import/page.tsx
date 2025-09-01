"use client";

import Header from "@/components/header/Header";
import { Sidebar } from "@/components/sidebar/SideMenu";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import ImportProducts from "@/components/products/ImportProducts";

export default function ImportProductsPage() {
  const { isOpen } = useSidebar();

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
          <ImportProducts />
        </div>
      </div>
    </div>
  );
}
