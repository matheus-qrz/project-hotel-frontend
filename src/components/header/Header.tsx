"use client";

import { Bell, Menu } from "lucide-react";
import { Button } from "../ui/button";
import { useSidebar } from "../ui/sidebar";
import { useRestaurantStore } from "@/stores";
import { useEffect } from "react";
import { extractNameFromSlug } from "@/utils/slugify";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function Header() {
  const route = useRouter();
  const { toggle, isOpen } = useSidebar();
  const { slug } = useParams();
  const { restaurant, fetchRestaurantData } = useRestaurantStore();
  const { data: session } = useSession();

  console.log("Restaurant Slug:", slug);

  // Seu componente
  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        console.log("Tentando carregar restaurante com slug:", slug);
        await fetchRestaurantData(String(slug));
      } catch (error) {
        console.error("Erro ao carregar restaurante:", error);
      }
    };

    loadRestaurant();
  }, []);

  function redirectToHomePage() {
    if (session) {
      if (session?.user.role === "ADMIN") {
        return route.push(`/admin/restaurant/${slug}/dashboard`);
      } else if (session.user.role === "MANAGER") {
        return route.push(`/admin/restaurant/${slug}/dashboard`);
      } else {
        return route.push(`/admin/restaurant/${slug}/attendant`);
      }
    }
  }

  const displayName =
    restaurant?.name || (slug ? extractNameFromSlug(String(slug)) : "");

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-border bg-background px-6 py-4">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={toggle}
        className="h-10 w-10 rounded-full border-border bg-background hover:bg-primary hover:text-secondary"
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>

      <h2
        className="cursor-pointer text-center text-xl font-medium text-primary"
        onClick={() => redirectToHomePage()}
      >
        {displayName}
      </h2>

      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-full border-border bg-background hover:bg-primary hover:text-secondary"
      >
        <Bell className="h-5 w-5" />
        <span className="sr-only">Notifications</span>
      </Button>
    </header>
  );
}
