"use client";

import { useEffect, useState } from "react";
import { useOrderStore, useRestaurantUnitStore } from "@/stores";
import { extractIdFromSlug } from "@/utils/slugify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowDown,
  CheckCircle,
  Clock,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Order, OrderItem } from "@/stores/order";
import {
  OrderStatus,
  OrderItemStatus,
  OrderStatusType,
  OrderItemStatusType,
} from "@/stores/order/types/order.types";
import { clearSessionId } from "@/utils/session";

interface ManagerScreenProps {
  slug: string;
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const StatusTexts: Record<OrderStatusType, string> = {
  [OrderStatus.PROCESSING]: "Em preparo",
  [OrderStatus.COMPLETED]: "Concluído",
  [OrderStatus.CANCELLED]: "Cancelado",
  [OrderStatus.PAYMENT_REQUESTED]: "Pagamento solicitado",
  [OrderStatus.PAID]: "Pago",
};

const StatusColors: Record<OrderStatusType, string> = {
  [OrderStatus.PROCESSING]: "bg-blue-200 text-blue-800",
  [OrderStatus.COMPLETED]: "bg-green-200 text-green-800",
  [OrderStatus.CANCELLED]: "bg-red-200 text-red-800",
  [OrderStatus.PAYMENT_REQUESTED]: "bg-purple-200 text-purple-800",
  [OrderStatus.PAID]: "bg-gray-200 text-gray-800",
};

const EDITABLE_TO_COMPLETE = new Set(["processing", "added", "reduced"]);

export default function ManagerScreen({ slug }: ManagerScreenProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [everCompletedByOrder, setEverCompletedByOrder] = useState<
    Record<string, boolean>
  >({});
  const [everCompletedItem, setEverCompletedItem] = useState<
    Record<string, boolean>
  >({});

  const { currentUnitId } = useRestaurantUnitStore();
  const {
    order,
    fetchRestaurantUnitOrders,
    updateOrderStatus,
    updateOrderItem,
    previousOrders,
  } = useOrderStore();

  const restaurantId = slug && extractIdFromSlug(String(slug));

  useEffect(() => {
    const loadOrders = async () => {
      if (restaurantId) {
        await fetchRestaurantUnitOrders(String(restaurantId));
      } else if (currentUnitId) {
        await fetchRestaurantUnitOrders("", String(currentUnitId));
      }
    };

    loadOrders();
  }, [restaurantId, currentUnitId, fetchRestaurantUnitOrders]);

  useEffect(() => {
    setEverCompletedByOrder((prev) => {
      const next = { ...prev };
      order.forEach((o) => {
        if (
          o.status === OrderStatus.COMPLETED ||
          o.items?.some((it) => it.status === OrderItemStatus.COMPLETED)
        )
          next[o._id] = true;
      });
      (previousOrders || []).forEach((prevO) => {
        const curr = order.find((o) => o._id === prevO._id);
        if (
          prevO.status === OrderStatus.COMPLETED &&
          curr?.status === OrderStatus.PAYMENT_REQUESTED
        ) {
          next[prevO._id] = true;
        }
      });
      return next;
    });

    setEverCompletedItem((prev) => {
      const next = { ...prev };
      order.forEach((o) => {
        o.items?.forEach((it) => {
          if (it.status === OrderItemStatus.COMPLETED) next[it._id] = true;
        });
      });
      (previousOrders || []).forEach((prevO) => {
        const curr = order.find((o) => o._id === prevO._id);
        if (curr?.status === OrderStatus.PAYMENT_REQUESTED) {
          const prevById = new Map(prevO.items.map((pi) => [pi._id, pi]));
          curr.items.forEach((ci) => {
            const prevItem = prevById.get(ci._id);
            if (prevItem?.status === OrderItemStatus.COMPLETED)
              next[ci._id] = true;
          });
        }
      });
      return next;
    });
  }, [order, previousOrders]);

  const handleRefresh = async () => {
    if (!restaurantId) return;
    setIsRefreshing(true);
    try {
      await fetchRestaurantUnitOrders(String(restaurantId));
    } catch (error) {
      console.error("Erro na atualização manual:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = async (
    orderId: string,
    tableId: number,
    newStatus: OrderStatusType,
  ) => {
    const targetOrder = order.find((o) => o._id === orderId);
    if (!targetOrder || !restaurantId) return;

    try {
      // mapeia status equivalente de item
      let itemStatus: OrderItemStatusType | null = null;
      if (newStatus === OrderStatus.PROCESSING)
        itemStatus = OrderItemStatus.PROCESSING;
      else if (newStatus === OrderStatus.COMPLETED)
        itemStatus = OrderItemStatus.COMPLETED;
      else if (newStatus === OrderStatus.CANCELLED)
        itemStatus = OrderItemStatus.CANCELLED;

      // Estados que não mexem em item
      if (
        newStatus === OrderStatus.PAYMENT_REQUESTED ||
        newStatus === OrderStatus.PAID
      ) {
        await updateOrderStatus(
          String(restaurantId),
          targetOrder._id,
          newStatus,
        );
        clearSessionId(
          String(restaurantId),
          Number(tableId),
          String(targetOrder.guestInfo.id),
        );
        return;
      }

      // 👉 COMPLETED / CANCELLED: primeiro itens, depois pedido
      if (
        newStatus === OrderStatus.COMPLETED ||
        newStatus === OrderStatus.CANCELLED
      ) {
        const targets =
          newStatus === OrderStatus.COMPLETED
            ? // completar somente itens editáveis e com quantidade > 0
              targetOrder.items.filter(
                (it) =>
                  EDITABLE_TO_COMPLETE.has(it.status) && (it.quantity ?? 0) > 0,
              )
            : // cancelar tudo que ainda não esteja cancelled/completed
              targetOrder.items.filter(
                (it) => it.status !== "completed" && it.status !== "cancelled",
              );

        if (itemStatus) {
          await Promise.allSettled(
            targets.map((it) =>
              updateOrderItem(
                String(restaurantId),
                tableId,
                targetOrder._id,
                it._id,
                { status: itemStatus },
              ),
            ),
          );
        }

        await updateOrderStatus(
          String(restaurantId),
          targetOrder._id,
          newStatus,
        );
        return;
      }

      // PROCESSING (ou outros que tenham equivalente de item): pedido primeiro, depois itens (se houver)
      await updateOrderStatus(String(restaurantId), targetOrder._id, newStatus);

      if (itemStatus) {
        const targets = targetOrder.items.filter(
          (it) => it.status !== "cancelled" && (it.quantity ?? 0) > 0,
        );

        await Promise.allSettled(
          targets.map((it) =>
            updateOrderItem(
              String(restaurantId),
              tableId,
              targetOrder._id,
              it._id,
              { status: itemStatus },
            ),
          ),
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const renderOrderItems = (order: Order, items: OrderItem[]) => {
    const purpleByOrder =
      order.status === OrderStatus.PAYMENT_REQUESTED &&
      !!everCompletedByOrder[order._id];

    return items.map((item, index) => {
      const isCancelled = item.status === OrderItemStatus.CANCELLED;
      const isCompleted = item.status === OrderItemStatus.COMPLETED;
      const isReduced = item.status === OrderItemStatus.REDUCED;

      // roxo se pedido está em payment_requested E (pedido/itens já concluídos)
      const purpleThisItem =
        order.status === OrderStatus.PAYMENT_REQUESTED &&
        (purpleByOrder || !!everCompletedItem[item._id] || isCompleted);

      const baseStyle = "text-md flex items-center gap-2";
      const statusClass = isCancelled
        ? "text-red-600 line-through"
        : purpleThisItem
          ? "text-purple-700"
          : isCompleted
            ? "text-muted-foreground line-through"
            : isReduced
              ? "text-yellow-600 italic"
              : "text-green-800";

      const statusIcon = isCancelled ? (
        <XCircle
          size={18}
          className="text-red-500"
        />
      ) : isCompleted ? (
        <CheckCircle
          size={18}
          className="text-muted-foreground"
        />
      ) : isReduced ? (
        <ArrowDown
          size={18}
          className="text-yellow-500"
        />
      ) : (
        <Clock
          size={18}
          className="text-green-600"
        />
      );

      return (
        <div
          key={index}
          className="mb-1 px-10"
        >
          <p className={`${baseStyle} ${statusClass}`}>
            {statusIcon}+{item.quantity}x {item.name}
          </p>
          {item.addons && (
            <ul className="text-md ml-12 list-disc text-muted-foreground">
              {item.addons.map((addon, i) => (
                <li key={i}>
                  {addon.name} (+R$ {addon.price.toFixed(2)})
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    });
  };

  const renderBadges = (order: Order) => {
    const badges = [];

    if (order.items.some((i) => i.status === "added")) {
      badges.push(
        <Badge
          key="novo"
          className="bg-blue-100 text-blue-800"
        >
          🆕 Novo item
        </Badge>,
      );
    }

    if (order.status === "cancelled") {
      badges.push(
        <Badge
          key="cancelado"
          className="bg-red-100 text-red-800"
        >
          ❌ Pedido cancelado
        </Badge>,
      );
    }

    if (order.items.some((i) => i.status === "reduced")) {
      badges.push(
        <Badge
          key="reduzido"
          className="bg-yellow-100 text-yellow-800"
        >
          ❗Item reduzido
        </Badge>,
      );
    }

    return <div className="flex items-center gap-2">{badges}</div>;
  };

  const renderOrderCard = (order: Order) => (
    <Card
      key={order._id}
      className="w-full max-w-lg rounded-xl bg-white shadow-md"
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-col items-start space-y-1 text-base">
          <div className="flex w-full items-start justify-between">
            <div className="flex items-center gap-2">{renderBadges(order)}</div>
            <Select
              value={order.status}
              onValueChange={(value) =>
                handleStatusChange(
                  order._id,
                  Number(order.meta.tableId),
                  value as OrderStatusType,
                )
              }
              disabled={(
                [OrderStatus.PAID, OrderStatus.CANCELLED] as OrderStatusType[]
              ).includes(order.status)}
            >
              <SelectTrigger
                className={`text-md w-[140px] ${StatusColors[order.status]} px-2`}
              >
                <SelectValue>{StatusTexts[order.status]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(OrderStatus).map(([key, value]) => (
                  <SelectItem
                    key={key}
                    value={value}
                  >
                    {StatusTexts[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <span className="text-md font-semibold text-primary">
            Mesa {Number(order.meta.tableId)}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="gap-4 pt-4 text-lg">
        <p>
          <strong>Cliente:</strong> {order.guestInfo?.name || "Anônimo"}
        </p>
        <p className="mt-1">
          <strong>Enviado às:</strong> {formatTime(String(order.createdAt))}
        </p>
        <p className="mt-1">
          <strong>Itens:</strong>
        </p>
        <div className="ml-4 space-y-1">
          {renderOrderItems(order, order.items)}
        </div>
        <p className="flex w-full flex-row justify-end pt-4">
          <strong>Total:</strong> R$ {order.totalAmount.toFixed(2)}
        </p>
      </CardContent>
    </Card>
  );

  const renderOrders = (status: string) => {
    return order.filter((o) => o.status === status).map(renderOrderCard);
  };

  return (
    <div className="h-screen max-h-screen w-full overflow-auto overflow-x-hidden bg-gray-50">
      <div className="mx-auto h-screen w-full p-4">
        {/* Cabeçalho com botão atualizar */}
        <div className="mb-4 flex items-center justify-between px-6">
          <h1 className="text-xl font-bold">Gerenciamento de Pedidos</h1>
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={isRefreshing}
            className="text-sm"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>

        {/* Grid com 3 colunas fixas */}
        <div className="grid grid-cols-3 items-start gap-6 px-6">
          {/* Em preparo */}
          <div className="flex min-h-[500px] flex-col gap-y-4">
            <h2 className="mb-4 border-r border-gray-400 text-lg font-semibold">
              Em preparo
            </h2>
            {renderOrders(OrderStatus.PROCESSING)}
          </div>

          {/* Concluídos */}
          <div className="flex min-h-[500px] flex-col gap-y-4">
            <h2 className="mb-4 border-r border-gray-400 text-lg font-semibold">
              Concluídos
            </h2>
            {renderOrders(OrderStatus.COMPLETED)}
          </div>

          {/* Pagamentos solicitados */}
          <div className="flex min-h-[500px] flex-col gap-y-4">
            <h2 className="mb-4 text-lg font-semibold">
              Pagamentos solicitados
            </h2>
            {renderOrders(OrderStatus.PAYMENT_REQUESTED)}
          </div>
        </div>
      </div>
    </div>
  );
}
