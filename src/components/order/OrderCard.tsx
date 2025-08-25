"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Order, OrderItem } from "./types";
import { useOrderStore } from "@/stores";
import { extractIdFromSlug } from "@/utils/slugify";
import { StatusTexts } from "@/components/cart/index";
import { Trash2, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useParams } from "next/navigation";

interface OrderCardProps {
  order: Order;
  className?: string;
  onStatusUpdate?: () => void;
}

export function OrderCard({
  order,
  className,
  onStatusUpdate,
}: OrderCardProps) {
  const { slug } = useParams();
  const [isUpdating, setIsUpdating] = useState(false);
  const [cancelQuantity, setCancelQuantity] = useState(1);
  const [itemToCancel, setItemToCancel] = useState<string | null>(null);
  const { cancelOrder, updateOrderItem } = useOrderStore();
  const [previousItems, setPreviousItems] = useState<OrderItem[]>(order.items);
  const restaurantId = slug && extractIdFromSlug(String(slug));

  useEffect(() => {
    setPreviousItems(order.items);
  }, [order.items]);

  const handleCancelOrder = async () => {
    if (!restaurantId || !order.meta.tableId) return;

    setIsUpdating(true);
    try {
      await cancelOrder(
        order._id,
        String(restaurantId),
        Number(order.meta.tableId),
      );
      onStatusUpdate?.();
    } catch (error) {
      console.error("Erro ao cancelar pedido:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelItem = async (
    itemId: string,
    currentQuantity: number,
    quantityToCancel: number,
  ) => {
    if (!restaurantId || !order.meta.tableId) return;

    const newQuantity = currentQuantity - quantityToCancel;
    setIsUpdating(true);

    try {
      await updateOrderItem(
        restaurantId,
        Number(order.meta.tableId),
        order._id,
        itemId,
        newQuantity > 0
          ? { quantity: newQuantity }
          : { quantity: 0, status: "cancelled" },
      );

      onStatusUpdate?.();
    } catch (error) {
      console.error("Erro ao atualizar quantidade do item:", error);
    } finally {
      setIsUpdating(false);
      setItemToCancel(null);
      setCancelQuantity(1);
    }
  };

  const canCancel = order.status === "processing";

  const renderOrderItems = (items: OrderItem[]) => {
    return items.map((item) => {
      const previousItem = previousItems.find((prev) => prev._id === item._id);
      const isNew = previousItem ? item.quantity > previousItem.quantity : true;
      const isCancelled = item.status === "cancelled";

      return (
        <div
          key={item._id}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-start justify-start py-4">
              <h3
                className={cn(
                  "font-medium",
                  isNew && "text-green-600",
                  isCancelled && "text-red-500 line-through",
                )}
              >
                {item.name}
              </h3>
              <p
                className={cn(
                  "text-sm text-gray-500",
                  isCancelled && "text-red-400 line-through",
                )}
              >
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(item.price)}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <span
              className={cn(
                "text-sm font-medium",
                isNew && "text-green-600",
                isCancelled && "text-red-500 line-through",
              )}
            >
              Quantidade: {item.quantity}
            </span>

            {/* Botão de cancelar só aparece se não estiver cancelado */}
            {canCancel && !isCancelled && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    disabled={isUpdating}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar item</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p className="text-md">
                        Esse item possui {item.quantity} unidades.
                      </p>
                      <p className="text-md">Quantas você deseja cancelar?</p>
                      <div className="flex items-center justify-center gap-6 p-4">
                        <Button
                          className="text-lg"
                          variant="outline"
                          onClick={() =>
                            setCancelQuantity((prev) => Math.max(1, prev - 1))
                          }
                        >
                          -
                        </Button>
                        <span>{cancelQuantity}</span>
                        <Button
                          className="text-lg"
                          variant="outline"
                          onClick={() =>
                            setCancelQuantity((prev) =>
                              Math.min(item.quantity, prev + 1),
                            )
                          }
                        >
                          +
                        </Button>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Não</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        handleCancelItem(
                          item._id,
                          item.quantity,
                          cancelQuantity,
                        )
                      }
                    >
                      Sim, cancelar {cancelQuantity} unidade
                      {cancelQuantity > 1 ? "s" : ""}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="text-sm text-muted-foreground">
          {new Date(order.createdAt).toLocaleTimeString()}
        </div>
        <Badge
          variant="secondary"
          className={cn(
            order.status === "processing" && "bg-blue-200 text-blue-800",
            order.status === "completed" && "bg-green-200 text-green-800",
            order.status === "cancelled" && "bg-red-200 text-red-800",
          )}
        >
          {StatusTexts[order.status]}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">{renderOrderItems(order.items)}</div>
      </CardContent>
      {canCancel && (
        <CardFooter className="flex justify-end pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isUpdating}
                className="flex items-center space-x-2"
              >
                <AlertCircle className="h-4 w-4" />
                <span>Cancelar Pedido</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar pedido</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja cancelar todo o pedido?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Não</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancelOrder}>
                  Sim, cancelar pedido
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      )}
    </Card>
  );
}
