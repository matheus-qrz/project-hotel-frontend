// components/cart/CartClient.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, ShoppingCart } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CartItem } from "@/components/cart/CartItem";
import { useCartStore, useGuestStore, useOrderStore } from "@/stores";
import { extractIdFromSlug } from "@/utils/slugify";
import { OrderItemStatus } from "@/stores/order/types/order.types";
import { generateOrGetGuestId } from "@/utils/guestId";
import { formatCurrency } from "@/utils/formatCurrency";

export const CartClient = () => {
  const router = useRouter();
  const { slug, tableId, unitId } = useParams();
  const [observations, setObservations] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<"local" | "takeaway">("local");
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [isFinalizingOrder, setIsFinalizingOrder] = useState(false);
  const [splitCount, setSplitCount] = useState(1);

  const restaurantId = slug && extractIdFromSlug(String(slug));

  const { items, getGuestId, getTotal, clearCart } = useCartStore();

  const {
    order,
    fetchGuestOrders,
    requestCheckout,
    cleanUpOrders,
    submitOrderUnified,
  } = useOrderStore();

  const { guestInfo } = useGuestStore();

  const guestId = guestInfo?.id;

  // Sincronização de pedidos
  useEffect(() => {
    if (!guestId || !restaurantId || !tableId) return;

    // Fazer apenas uma sincronização inicial
    const initialSync = async () => {
      try {
        await fetchGuestOrders(guestId, Number(tableId));
      } catch (error) {
        console.error("Erro na sincronização inicial:", error);
      }
    };

    initialSync();
  }, [restaurantId, tableId, guestId]);

  const submitOrder = async () => {
    const guestId = generateOrGetGuestId();
    if (!guestId || !guestInfo) {
      setError("Identificação do convidado não encontrada");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const orderData: any = {
        restaurantId: String(restaurantId),
        tableId: Number(tableId),
        isGuest: guestInfo ? true : false,
        items: items.map((item) => ({
          ...item,
          status: OrderItemStatus.ADDED,
          createdAt: new Date(),
          addons: item.addons?.map((addon) => ({
            ...addon,
            status: OrderItemStatus.ADDED,
            createdAt: new Date(),
          })),
        })),
        observations: observations || "",
        guestInfo: {
          id: guestId,
          name: guestInfo.name,
          joinedAt: guestInfo.joinedAt,
        },
        meta: {
          tableId: Number(tableId),
          guestId,
          orderType,
          observations,
          splitCount,
          orderCreatedAt: new Date(),
        },
        totalAmount: getTotal(),
      };

      if (unitId) orderData.restaurantUnitId = String(unitId);

      const submittedOrder = await submitOrderUnified(orderData);

      if (!submittedOrder) {
        setError("Falha ao enviar pedido.");
        return;
      }

      setSubmissionSuccess(true);
      clearCart();
      cleanUpOrders();
      setTimeout(() => {
        setSubmissionSuccess(false);
        router.push(`/restaurant/${slug}/${tableId}/menu`);
      }, 2000);
    } catch (error) {
      console.error("Erro ao enviar pedido:", error);
      setError("Falha ao enviar pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const guestId = guestInfo?.id;
    if (guestId && tableId) {
      fetchGuestOrders(guestId, Number(tableId));

      const syncInterval = setInterval(() => {
        fetchGuestOrders(guestId, Number(tableId));
      }, 30000); // Sincroniza a cada 30 segundos

      return () => clearInterval(syncInterval);
    }
  }, [tableId, guestInfo]);

  const finalizeOrder = async () => {
    const orderId = order[0]._id;
    const guestId = guestInfo?.id;

    if (!guestId || !tableId) {
      setError("Informações incompletas para fechamento");
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
      setShowFinishDialog(false);
      clearCart();
      router.push(`/restaurant/${slug}/${tableId}/payment-requested`);
    } catch (error) {
      console.error("Erro ao finalizar conta:", error);
      setError("Falha ao solicitar fechamento. Chame um atendente.");
    } finally {
      setIsFinalizingOrder(false);
    }
  };

  const total = getTotal();
  const totalPerPerson = splitCount > 1 ? total / splitCount : total;

  if (items.length === 0 && !submissionSuccess && !isSubmitting) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-6">
        <div className="py-8 text-center text-gray-500">
          <ShoppingCart
            className="mx-auto mb-3 text-gray-300"
            size={40}
          />
          <p>Seu carrinho está vazio</p>
          <Button
            variant="link"
            onClick={() => router.push(`/restaurant/${slug}/${tableId}/menu`)}
            className="mt-2"
          >
            Adicionar itens
          </Button>
        </div>
      </div>
    );
  }

  if (submissionSuccess) {
    return (
      <div className="container mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-10">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-500">
              <Send size={24} />
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-primary">
            Pedido enviado com sucesso!
          </h1>
          <p className="mb-6 text-gray-500">
            Seu pedido foi recebido e está sendo preparado.
          </p>
          {tableId && (
            <p className="mb-2 font-medium text-primary">Mesa {tableId}</p>
          )}
          <p className="mb-4 text-gray-500">
            {orderType === "local"
              ? "Um atendente trará seu pedido em breve."
              : "Seu pedido para viagem estará pronto em breve."}
          </p>
          <p className="text-sm text-gray-400">
            Você pode fazer mais pedidos a qualquer momento!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 pb-32">
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => router.push(`/restaurant/${slug}/${tableId}/menu`)}
        >
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold text-primary">Seu pedido</h1>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Itens no carrinho */}
      <div className="mb-6 space-y-2">
        {items.map((item) => (
          <CartItem
            key={item._id}
            id={item._id}
            name={item.name}
            price={item.price}
            image={item.image}
            costPrice={item.costPrice}
            quantity={item.quantity}
            itemStatus={item.status || OrderItemStatus.PROCESSING}
            guestId={getGuestId() || ""}
            addons={item.addons}
          />
        ))}
      </div>

      {items.length > 0 && (
        <>
          {/* Tipo de pedido */}
          <div className="mb-6 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 font-medium text-primary">Tipo de Pedido</h3>
            <RadioGroup
              value={orderType}
              onValueChange={(value) =>
                setOrderType(value as "local" | "takeaway")
              }
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="local"
                  id="local"
                />
                <Label htmlFor="local">Consumir no local</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="takeaway"
                  id="takeaway"
                />
                <Label htmlFor="takeaway">Para viagem</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Observações */}
          <div className="mb-6">
            <h3 className="mb-2 font-medium text-primary">Observações</h3>
            <Textarea
              placeholder="Alguma observação sobre seu pedido? (Ex: sem cebola, ponto da carne, etc)"
              className="border-gray-200"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>

          {/* Resumo do pedido */}
          <div className="mb-24 border-t border-gray-200 pt-4">
            <div className="mb-2 flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
        </>
      )}

      {/* Botões de ação fixos */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-2 px-4">
        {items.length > 0 ? (
          <>
            <Button
              onClick={submitOrder}
              disabled={isSubmitting || items.length === 0}
              variant="default"
              className="flexx flex-1 items-center gap-2 rounded-full bg-primary px-6 py-3 text-secondary shadow-lg"
            >
              {isSubmitting ? (
                "Enviando..."
              ) : (
                <>
                  <Send size={18} />
                  <span>
                    {orderType === "local" ? "Fazer pedido" : "Finalizar"} •
                    {formatCurrency(splitCount > 1 ? totalPerPerson : total)}
                  </span>
                </>
              )}
            </Button>
          </>
        ) : (
          <Button
            onClick={() => router.push(`/restaurant/${slug}/${tableId}/menu`)}
            variant="default"
            className="flex w-full max-w-md items-center gap-2 rounded-full bg-primary px-6 py-3 text-secondary shadow-lg"
          >
            Voltar ao cardápio
          </Button>
        )}
      </div>

      {/* Diálogo de confirmação */}
      <AlertDialog
        open={showFinishDialog}
        onOpenChange={setShowFinishDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao solicitar o fechamento da conta, um atendente virá até sua mesa
              para o pagamento.
              {items.length > 0 && (
                <p className="mt-2 text-sm">
                  Você ainda tem itens no carrinho. Deseja enviá-los antes de
                  finalizar?
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isFinalizingOrder}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={finalizeOrder}
              disabled={isFinalizingOrder}
              className="hover:bg-primary/90 bg-primary text-white"
            >
              {isFinalizingOrder ? "Solicitando..." : "Solicitar conta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
