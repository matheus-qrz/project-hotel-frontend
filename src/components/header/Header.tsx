"use client";

import { useEffect, useState } from "react";
import { Bell, Menu, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHotelStore } from "@/stores/hotel";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSidebar } from "../ui/sidebar";
import { useAuthStore } from "@/stores";

export default function Header() {
  const router = useRouter();
  const { hotelSlug, _hydrated, updateFromSession } = useAuthStore();
  const { fetchHotelData } = useHotelStore();
  const { data: session, status } = useSession();
  const { toggle } = useSidebar();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sincroniza a session com o authStore assim que estiver disponível
  useEffect(() => {
    if (status === "authenticated" && session) {
      updateFromSession(session);
    }
  }, [session, status]);

  // Só busca quando o store estiver hidratado E o slug disponível
  useEffect(() => {
    if (!_hydrated) return;
    if (!hotelSlug || hotelSlug === "null" || hotelSlug === "undefined") {
      console.warn("[Header] hotelSlug ainda inválido:", hotelSlug);
      return;
    }

    const load = async () => {
      try {
        await fetchHotelData(hotelSlug);
      } catch (error) {
        console.error("Erro ao carregar hotel:", error);
      }
    };

    load();
  }, [hotelSlug, _hydrated]); // ✅ re-executa quando o slug chegar

  async function handleRefresh() {
    if (!hotelSlug) return;
    setIsRefreshing(true);
    try {
      await fetchHotelData(hotelSlug);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  }

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-50 flex h-24 w-full items-center justify-between border-b border-stone-200 bg-white p-3 px-6">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={toggle}
        className="h-8 w-8 rounded-lg border-stone-200 text-stone-400 hover:bg-stone-50 hover:text-stone-700"
        aria-label="Abrir menu"
      >
        <Menu className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-3">
        <span className="hidden text-xs capitalize text-stone-400 sm:block">
          {today}
        </span>

        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          className="h-8 w-8 rounded-lg border-stone-200 text-stone-400 hover:bg-stone-50 hover:text-stone-700"
          aria-label="Atualizar dados"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 transition-transform ${isRefreshing ? "animate-spin" : ""}`}
          />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="relative h-8 w-8 rounded-lg border-stone-200 text-stone-400 hover:bg-stone-50 hover:text-stone-700"
          aria-label="Notificações"
        >
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-[1.5px] ring-white" />
        </Button>
      </div>
    </header>
  );
}
