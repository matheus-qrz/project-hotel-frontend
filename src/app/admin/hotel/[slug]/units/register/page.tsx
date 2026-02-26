// page.tsx
"use client";

import { Sidebar } from "@/components/sidebar/Sidebar";
import Header from "@/components/header/Header";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import AddRestaurantUnit from "@/components/units/add/AddRestaurantUnit";
import { useParams } from "next/navigation";
import { extractIdFromSlug } from "@/utils/slugify";
import { useAuthStore } from "@/stores";

export default function AddUnitPage() {
  const { slug } = useParams();
  const { isOpen } = useSidebar();
  const { isLoading } = useAuthStore();

  const restaurantId = slug && extractIdFromSlug(String(slug));

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-1/4 rounded bg-gray-200"></div>
          <div className="mb-6 h-10 w-full rounded bg-gray-200"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 rounded bg-gray-200"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main
          className={cn(
            "flex-1 transition-all duration-300",
            isOpen ? "ml-64" : "ml-0",
          )}
        >
          <div className="mx-auto max-w-5xl px-6 py-8">
            {restaurantId && typeof restaurantId === "string" && (
              <AddRestaurantUnit restaurantId={restaurantId} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
