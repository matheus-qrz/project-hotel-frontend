"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useOrderStore } from "@/stores/order/orderStore";
import { useGuestStore } from "@/stores";
import { OrdersScreen } from "@/components/order/OrderScreen";

export default function OrderPage() {
  const { tableId } = useParams();
  const [error, setError] = useState<string | null>(null);
  const { fetchGuestOrders } = useOrderStore();
  const { guestInfo } = useGuestStore();

  const guestId = guestInfo?.id;

  console.log("guestId: ", guestId);

  useEffect(() => {
    if (guestId) {
      console.log("Carregando pedidos para o guestId:", guestId);
      fetchGuestOrders(guestId, Number(tableId));
    } else {
      console.error("guestId não encontrado.");
    }
  }, [guestId]);

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

  return <OrdersScreen />;
}
