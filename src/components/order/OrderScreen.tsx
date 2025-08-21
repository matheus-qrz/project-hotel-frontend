import React, { useEffect, useState } from "react";
import { useOrderStore, CartItemProps, useGuestStore } from "@/stores";
import { OrderCard } from "../order/OrderCard";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { extractIdFromSlug } from "@/utils/slugify";
import { Label } from "../ui/label";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

const OrdersScreen = () => {
  const router = useRouter();
  const { slug, tableId } = useParams();
  const { order, requestCheckout, fetchGuestOrders } = useOrderStore();
  const { guestInfo } = useGuestStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [isFinalizingOrder, setIsFinalizingOrder] = useState(false);
  const [splitCount, setSplitCount] = useState(1);

  const restaurantId = slug && extractIdFromSlug(String(slug));

  const guestId = guestInfo?.id;

  useEffect(() => {
    if (guestId && tableId) {
      fetchGuestOrders(guestId, Number(tableId));
    }
  }, [guestId, tableId]);

  console.log("guestId", guestId);

  const handleCheckout = async () => {
    const orderId = order[0]._id;

    if (!guestId || !tableId) {
      console.error("Informações incompletas para fechamento");
      return;
    }

    setIsFinalizingOrder(true);
    try {
      await requestCheckout(
        String(orderId),
        String(guestId),
        String(restaurantId),
        Number(tableId),
        splitCount,
      );
      router.push(`/restaurant/${slug}/${tableId}/payment-requested`);
    } catch (error) {
      console.error("Erro ao solicitar fechamento:", error);
    } finally {
      setIsFinalizingOrder(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchGuestOrders(String(guestId), Number(tableId));
      console.log("Atualização concluída");
    } catch (error) {
      console.error("Erro na atualização manual:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const totalAmount =
    order[0]?.status === "cancelled"
      ? 0
      : order.reduce((total, item) => total + item.totalAmount, 0);
  const dividedAmount = totalAmount / splitCount;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex flex-row items-center justify-between gap-2">
        <div className="flex flex-row items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft />
          </Button>
          <h1 className="text-xl font-bold text-primary">Meus Pedidos</h1>
        </div>
        <div className="flex flex-row">
          <Button
            onClick={handleRefresh}
            className="flex items-center gap-2"
            variant="outline"
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Atualizando..." : ""}
          </Button>
        </div>
      </div>

      {order.length === 0 ? (
        <div className="mt-8 text-center">
          <p>Nenhum pedido encontrado.</p>
        </div>
      ) : (
        <div className="mt-4">
          {order.map((order) => (
            <OrderCard
              key={order._id}
              order={{
                ...order,
                items: order.items.map((item: CartItemProps) => ({
                  ...item,
                  id: item._id ?? "",
                  imageUrl: item.image ?? "",
                  guestId: order.guestInfo?.id ?? "",
                })),
                createdAt:
                  typeof order.createdAt === "string"
                    ? new Date(order.createdAt)
                    : order.createdAt,
              }}
              onStatusUpdate={() =>
                fetchGuestOrders(String(guestId), Number(tableId))
              }
            />
          ))}
          <div className="items-centerspace-x-2 mt-4 flex w-full flex-col">
            <div className="flex flex-row items-center justify-between">
              <Label className="text-sm font-normal text-gray-700">
                Dividir conta por:
              </Label>
              <div className="flex flex-row items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setSplitCount((prev) => Math.max(1, prev - 1))}
                >
                  -
                </Button>
                <span className="px-1">{splitCount}</span>
                <Button
                  variant="outline"
                  onClick={() => setSplitCount((prev) => prev + 1)}
                >
                  +
                </Button>
              </div>
            </div>
            <div className="mt-4 flex w-full flex-row justify-between">
              <Label className="text-sm text-gray-600">Valor por pessoa:</Label>
              <span>{formatCurrency(dividedAmount)}</span>
            </div>
          </div>

          <div className="mt-6 flex w-full flex-col gap-4">
            <div className="flex flex-row justify-between font-bold">
              <Label className="text-md">Total:</Label>
              <span className="text-md">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div className="mt-8 flex w-full flex-row items-center justify-end">
            <Button
              onClick={() => setShowFinishDialog(true)}
              className="mt-4"
            >
              Fechar a Conta
            </Button>
          </div>
        </div>
      )}

      <AlertDialog
        open={showFinishDialog}
        onOpenChange={setShowFinishDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar Conta</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja fechar a conta? Um atendente virá até
              você para o pagamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isFinalizingOrder}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCheckout}
              disabled={isFinalizingOrder}
            >
              {isFinalizingOrder ? "Solicitando..." : "Fechar Conta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrdersScreen;
