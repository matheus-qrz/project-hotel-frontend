"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRestaurantStore, useTableStore, useCartStore } from "@/stores";
import { extractIdFromSlug } from "@/utils/slugify";
import { Button } from "@/components/ui/button";
import { Book } from "lucide-react";
import { Label } from "@/components/ui/label";
import { DelayedLoading } from "@/components/loading/DelayedLoading";
import GuestLogin from "@/components/login/GuestLogin";
import { useGuestStore } from "@/stores/auth/guestStore";
import { v4 as uuidv4 } from "uuid";

export default function TableIdentificationPage() {
  const { slug, tableId } = useParams();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { restaurant, fetchRestaurantData } = useRestaurantStore();
  const { setTableInfo } = useTableStore();
  const { guestInfo, setGuestInfo, setRestaurantId, setTableId } =
    useGuestStore();

  async function ensureGuestSession({
    tableId,
    guestId,
    guestName,
  }: {
    tableId: number;
    guestId: string;
    guestName: string;
  }) {
    const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

    const res = await fetch(
      `${API_URL}/restaurant/table/${tableId}/guest/${guestId}/orders/initiate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestName }),
      },
    );
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Falha ao iniciar sessão: ${res.status} ${t}`);
    }
    return res.json();
  }

  useEffect(() => {
    const initializeData = async () => {
      if (!slug || !tableId) {
        setError("Parâmetros inválidos");
        return;
      }

      try {
        setIsLoading(true);
        await fetchRestaurantData(String(slug));

        const restaurantId = extractIdFromSlug(String(slug));
        const tableIdNum = Number(tableId);

        setTableInfo(tableIdNum, restaurantId);
        setRestaurantId(restaurantId);
        setTableId(tableIdNum);
      } catch (error: any) {
        console.error("Erro ao carregar dados:", error);
        setError(
          error.message || "Erro ao carregar informações do restaurante.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [slug, tableId]);

  const navigateToMenu = () => {
    if (!slug) return;
    router.push(`/restaurant/${slug}/${tableId}/menu`);
  };

  const startAndGoToMenu = async (guestName: string) => {
    const restaurantId = extractIdFromSlug(String(slug));
    const gid = uuidv4();

    // salva no store do convidado
    setGuestInfo({
      id: gid,
      name: guestName,
      joinedAt: new Date().toISOString(),
    });
    setRestaurantId(restaurantId);
    setTableId(Number(tableId));

    // GARANTA a criação/recuperação do pedido antes da navegação
    const { orderId } = await ensureGuestSession({
      tableId: Number(tableId),
      guestId: gid,
      guestName,
    });

    // se seu store tiver, salve o orderId para futuras chamadas
    useGuestStore.getState().setOrderId?.(orderId);

    // redireciona para o menu
    navigateToMenu();
  };

  const continueAsGuest = () => startAndGoToMenu(`Mesa ${tableId}`);

  if (isLoading) {
    return <DelayedLoading />;
  }

  if (error) {
    return (
      <div className="container mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-16">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-xl font-bold text-red-600">Erro</h1>
          <p className="text-gray-600">{error}</p>
        </div>
        <Button
          onClick={() => router.push("/")}
          variant="outline"
        >
          Voltar à Página Inicial
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-[90vh] max-w-md flex-col px-4 py-8">
      <div className="mb-6 text-center">
        <div className="bg-primary/10 mb-4 inline-block rounded-full p-4">
          <Book
            size={40}
            className="text-primary"
          />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-primary">Mesa {tableId}</h1>
        {restaurant && (
          <p className="mb-4 text-gray-600">
            {`Você está acessando o cardápio digital de ${restaurant.name}`}
          </p>
        )}
      </div>

      <div className="flex flex-grow flex-col justify-start gap-2">
        <div className="flex flex-col items-center justify-center gap-4">
          <Label className="text-xl font-bold">Seja bem-vindo!</Label>
          <div className="mb-8 rounded-lg">
            <p className="text-md">
              Identifique-se para facilitar seus pedidos.
            </p>
          </div>
        </div>

        <GuestLogin />

        <div className="my-4 flex w-full items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="mx-4 text-sm text-gray-500">ou</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <Button
          onClick={continueAsGuest}
          variant="default"
          className="w-full"
        >
          Ver Cardápio
        </Button>
      </div>
    </div>
  );
}
