"use client";

import { useEffect, useState } from "react";
import { Bell, Menu, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHotelStore } from "@/stores/hotel";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSidebar } from "../ui/sidebar";

export default function Header() {
  const router = useRouter();
  const { slug } = useParams();
  const { hotel, fetchHotelData } = useHotelStore();
  const { data: session } = useSession();
  const { toggle } = useSidebar();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        await fetchHotelData(String(slug));
      } catch (error) {
        console.error("Erro ao carregar hotel:", error);
      }
    };
    load();
  }, []);

  function redirectToHome() {
    if (!session) return;
    router.push(`/admin/hotel/${slug}/dashboard`);
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await fetchHotelData(String(slug));
    } finally {
      // Mantém o ícone girando por pelo menos 600ms para feedback visual
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
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-stone-200 bg-white px-6">
      {/* Hamburguer — mesmo padrão do projeto restaurante */}
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

      {/* Direita: data + ações */}
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
