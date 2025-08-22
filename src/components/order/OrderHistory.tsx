"use client";

import { useEffect, useState } from "react";
import { useOrderStore, useRestaurantUnitStore, useTableStore } from "@/stores";
import { extractIdFromSlug } from "@/utils/slugify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface OrderHistoryProps {
  slug: string;
}

type OrderStatus =
  | "processing"
  | "completed"
  | "cancelled"
  | "payment_requested"
  | "paid";

const StatusTexts = {
  pending: "Pendente",
  processing: "Em preparo",
  completed: "Concluído",
  cancelled: "Cancelado",
  payment_requested: "Pagamento solicitado",
  paid: "Pago",
};

export function OrderHistory({ slug }: OrderHistoryProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { order, fetchRestaurantUnitOrders } = useOrderStore();
  const { currentUnitId } = useRestaurantUnitStore();

  const restaurantId = slug && extractIdFromSlug(String(slug));

  useEffect(() => {
    if (restaurantId || currentUnitId) {
      // Carregar pedidos ao montar o componente
      fetchRestaurantUnitOrders(restaurantId, String(currentUnitId));
      console.log("Component mounted: ", fetchRestaurantUnitOrders);

      const interval = setInterval(() => {
        fetchRestaurantUnitOrders(restaurantId, String(currentUnitId));
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [restaurantId, currentUnitId]);

  const handleRefresh = async () => {
    if (!restaurantId) {
      console.log("Faltam parâmetros para atualização:", {
        restaurantId,
        currentUnitId,
      });
      return;
    }

    console.log("Iniciando atualização manual com:", {
      restaurantId,
      currentUnitId,
    });

    try {
      await fetchRestaurantUnitOrders(
        restaurantId,
        currentUnitId ? String(currentUnitId) : "",
      );
      console.log("Atualização concluída");
    } catch (error) {
      console.error("Erro na atualização manual:", error);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors = {
      pending: "bg-yellow-200 text-yellow-800",
      processing: "bg-blue-200 text-blue-800",
      completed: "bg-green-200 text-green-800",
      cancelled: "bg-red-200 text-red-800",
      payment_requested: "bg-purple-200 text-purple-800",
      paid: "bg-gray-200 text-gray-800",
    };
    return colors[status];
  };

  const getStatusText = (status: OrderStatus) => {
    return StatusTexts[status];
  };

  const renderOrders = (statuses: OrderStatus[]) => {
    return order
      .filter((order) => statuses.includes(order.status as OrderStatus))
      .map((order) => (
        <Card
          key={order._id}
          className="mb-4"
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-xl font-semibold text-primary">
              <span>Mesa {order.meta.tableId}</span>
              <Select
                value={order.status}
                disabled={
                  order.status === "paid" || order.status === "cancelled"
                }
              >
                <SelectTrigger
                  className={`w-[180px] ${getStatusColor(order.status as OrderStatus)}`}
                >
                  <SelectValue>
                    {getStatusText(order.status as OrderStatus) ||
                      "Status Desconhecido"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(StatusTexts).map((key) => (
                    <SelectItem
                      key={key}
                      value={key}
                    >
                      {StatusTexts[key as OrderStatus]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Cliente:</strong> {order.guestInfo?.name || "Anônimo"}
              </p>
              <p>
                <strong>Itens:</strong>
              </p>
              <ul>
                {order.items.map((item) => (
                  <li key={item._id}>
                    {item.quantity}x {item.name}
                  </li>
                ))}
              </ul>
              <p>
                <strong>Total:</strong> R$ {order.totalAmount.toFixed(2)}
              </p>
              {order.meta?.observations && (
                <p>
                  <strong>Observações:</strong> {order.meta.observations}
                </p>
              )}
              {order.meta?.orderType && (
                <p>
                  <strong>Tipo:</strong>{" "}
                  {order.meta.orderType === "local" ? "Local" : "Para Viagem"}
                </p>
              )}
              {order.meta?.splitCount && order.meta.splitCount > 1 && (
                <p>
                  <strong>Divisão:</strong> {order.meta.splitCount} pessoas
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ));
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="mx-auto w-full p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Histórico de Pedidos</h1>
          <Button
            onClick={handleRefresh}
            className="flex items-center gap-2"
            variant="outline"
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Atualizando..." : "Atualizar Pedidos"}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-2">
          <div className="min-h-[calc(100vh-200px)] overflow-y-auto rounded-lg bg-white p-6 shadow-sm">
            <h2 className="sticky top-0 mb-6 bg-white py-2 text-lg font-semibold">
              Pagos
            </h2>
            <div className="space-y-4">{renderOrders(["paid"])}</div>
          </div>

          <div className="min-h-[calc(100vh-200px)] overflow-y-auto rounded-lg bg-white p-6 shadow-sm">
            <h2 className="sticky top-0 mb-6 bg-white py-2 text-lg font-semibold">
              Cancelados
            </h2>
            <div className="space-y-4">{renderOrders(["cancelled"])}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderHistory;
