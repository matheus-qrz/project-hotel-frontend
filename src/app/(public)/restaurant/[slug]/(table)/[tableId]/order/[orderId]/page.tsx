"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { extractIdFromSlug, extractNameFromSlug } from "@/utils/slugify";
import OrderConfirmation from "@/components/order/OrderConfirmation";
import { useOrderStore, Order } from "@/stores/order/orderStore";
import { useRestaurantStore } from "@/stores/restaurant";
import { useGuestStore } from "@/stores";

export default function OrderPage() {
  const { slug, tableId, orderId, unitId } = useParams();
  const searchParams = useSearchParams();
  const { fetchRestaurantData } = useRestaurantStore();
  const splitCount = searchParams.get("split")
    ? parseInt(searchParams.get("split")!)
    : 1;
  const router = useRouter();

  const { guestInfo } = useGuestStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restaurantData, setRestaurantData] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { order, fetchGuestOrders } = useOrderStore();

  const guestId = guestInfo?.id;

  const restaurantId = slug && extractIdFromSlug(String(slug));
  const restaurantName = slug && extractNameFromSlug(String(slug));

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!restaurantId || !tableId) {
          throw new Error("Informações do restaurante não encontradas.");
        }

        // Carregar dados do restaurante
        const restaurant = await fetchRestaurantData(String(restaurantId));
        if (!restaurantId) {
          throw new Error("Restaurante não encontrado.");
        }
        setRestaurantData({
          id: String(restaurantId),
          name: String(restaurantName),
        });

        await fetchGuestOrders(String(guestId), Number(tableId));
      } catch (err: any) {
        console.error("Erro ao carregar dados:", err);
        setError(err.message || "Erro ao carregar dados.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [restaurantId, tableId, fetchGuestOrders]);

  const handleBackToMenu = () => {
    router.push(`/restaurant/${slug}/${tableId}/menu`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-md px-4 py-8">
        <div className="animate-pulse">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100"></div>
          <div className="mx-auto mb-2 h-8 w-3/4 rounded bg-gray-200"></div>
          <div className="mx-auto mb-8 h-4 w-1/2 rounded bg-gray-200"></div>
          <div className="mb-6 h-48 rounded bg-gray-200"></div>
          <div className="mb-8 h-48 rounded bg-gray-200"></div>
          <div className="mb-3 h-12 rounded bg-gray-200"></div>
          <div className="h-12 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-md px-4 py-8 text-center">
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <h2 className="mb-2 text-lg font-bold">Erro</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Encontrar o pedido específico nos pedidos carregados
  const orderData = order.find((order: Order) => order._id === orderId);

  if (!orderData) {
    return (
      <div className="container mx-auto max-w-md px-4 py-8 text-center">
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-700">
          <h2 className="mb-2 text-lg font-bold">Pedido não encontrado</h2>
          <p>Não foi possível encontrar os detalhes deste pedido.</p>
        </div>
      </div>
    );
  }

  return (
    <OrderConfirmation
      orderId={String(orderId)}
      restaurantId={String(restaurantId)}
      restaurantName={restaurantData?.name || String(restaurantName)}
      tableId={Number(tableId)}
      splitCount={splitCount}
      onBackToMenu={handleBackToMenu}
    />
  );
}
