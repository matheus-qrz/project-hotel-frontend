// components/cart/CartClient.tsx
'use client';

import React, { useState, useEffect, useMemo } from "react";
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
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import CartItem from "@/components/cart/CartItem";
import { formatCurrency } from "@/services/restaurant/services";
import { useCartStore, useOrderStore } from "@/stores";
import { extractIdFromSlug } from "@/utils/slugify";
import { OrderItemStatus, OrderStatus } from "@/stores/order/types/order.types";

export function CartClient() {
    const router = useRouter();
    const { slug, tableId } = useParams();
    const [observations, setObservations] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionSuccess, setSubmissionSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [orderType, setOrderType] = useState<'local' | 'takeaway'>('local');
    const [showFinishDialog, setShowFinishDialog] = useState(false);
    const [isFinalizingOrder, setIsFinalizingOrder] = useState(false);
    const [splitCount, setSplitCount] = useState(1);

    const restaurantId = slug && extractIdFromSlug(String(slug));

    const {
        items,
        guestInfo,
        getGuestId,
        getTotal,
        clearCart,
        updateItemStatus,
        setObservations: setCartObservations,
        setOrderType: setCartOrderType
    } = useCartStore();

    const {
        order,
        setOrders,
        fetchGuestOrders,
        createOrder,
        requestCheckout,
        updateOrder,
        deleteOldOrders,
        cleanUpOrders,
        addItemsToOrder
    } = useOrderStore();

    const guestId = getGuestId();

    // Sincronização de pedidos
    useEffect(() => {
        if (!guestId || !restaurantId || !tableId) return;

        // Fazer apenas uma sincronização inicial
        const initialSync = async () => {
            try {
                await fetchGuestOrders(
                    guestId, String(tableId)
                );
            } catch (error) {
                console.error('Erro na sincronização inicial:', error);
            }
        };

        initialSync();
    }, [restaurantId, tableId, guestId]);

    const submitOrder = async () => {
        const guestId = getGuestId();
        if (!guestId || !guestInfo) {
            setError("Identificação do convidado não encontrada");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            deleteOldOrders();

            await fetchGuestOrders(guestId, String(tableId));
            const refreshedOrders = order;
            const existingOrder = refreshedOrders.find(o =>
                o.guestInfo.id === guestId &&
                ['processing', 'payment_requested'].includes(o.status) &&
                !o.isPaid
            );

            if (existingOrder) {
                // Só adiciona os novos itens, sem sobrescrever os antigos
                const newItems = items.map(item => ({
                    ...item,
                    status: OrderItemStatus.ADDED,
                    createdAt: new Date(),
                    addons: item.addons?.map(addon => ({
                        ...addon,
                        status: OrderItemStatus.ADDED,
                        createdAt: new Date()
                    }))
                }));

                // ✅ Usando a função correta da store
                await addItemsToOrder(String(restaurantId), String(tableId), existingOrder._id, newItems, getTotal());

                await fetchGuestOrders(guestId, String(tableId));

                console.log("caiu corretamente");
            } else {
                // Cria um novo pedido
                const orderData = {
                    items: items.map(item => ({
                        _id: item._id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        status: OrderItemStatus.ADDED,
                        createdAt: new Date(),
                        addons: item.addons?.map(addon => ({
                            ...addon,
                            status: OrderItemStatus.ADDED,
                            createdAt: new Date()
                        })),
                        observations: item.observations
                    })),
                    totalAmount: getTotal(),
                    status: OrderStatus.PROCESSING,
                    meta: {
                        tableId: Number(tableId),
                        guestId,
                        orderType,
                        observations,
                        splitCount,
                        orderCreatedAt: new Date()
                    },
                    guestInfo: {
                        id: guestId,
                        name: guestInfo.name,
                        joinedAt: guestInfo.joinedAt
                    }
                };

                const newOrder = await createOrder(
                    orderData,
                    String(restaurantId),
                    String(tableId)
                );

                setOrders([...order, newOrder]);

                await fetchGuestOrders(guestId, String(tableId));
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
        const guestId = getGuestId();
        if (guestId && tableId) {
            fetchGuestOrders(guestId, String(tableId));

            const syncInterval = setInterval(() => {
                fetchGuestOrders(guestId, String(tableId));
            }, 30000); // Sincroniza a cada 30 segundos

            return () => clearInterval(syncInterval);
        }
    }, [tableId, getGuestId]);

    const finalizeOrder = async () => {
        const orderId = order[0]._id
        const guestId = getGuestId();
        if (!guestId || !tableId) {
            setError("Informações incompletas para fechamento");
            return;
        }

        setIsFinalizingOrder(true);
        try {
            await requestCheckout([String(orderId)], String(guestId), String(restaurantId), String(tableId), splitCount);
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
            <div className="container mx-auto px-4 py-6 max-w-2xl">
                <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="mx-auto mb-3 text-gray-300" size={40} />
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
            <div className="container mx-auto px-4 py-10 max-w-2xl flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center">
                            <Send size={24} />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-primary mb-2">Pedido enviado com sucesso!</h1>
                    <p className="text-gray-500 mb-6">Seu pedido foi recebido e está sendo preparado.</p>
                    {tableId && (
                        <p className="text-primary font-medium mb-2">Mesa {tableId}</p>
                    )}
                    <p className="text-gray-500 mb-4">
                        {orderType === 'local'
                            ? 'Um atendente trará seu pedido em breve.'
                            : 'Seu pedido para viagem estará pronto em breve.'}
                    </p>
                    <p className="text-sm text-gray-400">Você pode fazer mais pedidos a qualquer momento!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 max-w-2xl pb-32">
            <div className="flex items-center mb-6">
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
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            {/* Itens no carrinho */}
            <div className="space-y-2 mb-6">
                {items.map((item) => (
                    <CartItem
                        key={item._id}
                        id={item._id}
                        name={item.name}
                        image={item.image}
                        price={item.price}
                        quantity={item.quantity}
                        itemStatus={item.status || OrderItemStatus.PROCESSING}
                        guestId={getGuestId() || ''}
                    />
                ))}
            </div>

            {items.length > 0 && (
                <>
                    {/* Tipo de pedido */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
                        <h3 className="font-medium text-primary mb-3">Tipo de Pedido</h3>
                        <RadioGroup
                            value={orderType}
                            onValueChange={(value) => setOrderType(value as 'local' | 'takeaway')}
                            className="space-y-2"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="local" id="local" />
                                <Label htmlFor="local">Consumir no local</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="takeaway" id="takeaway" />
                                <Label htmlFor="takeaway">Para viagem</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Observações */}
                    <div className="mb-6">
                        <h3 className="font-medium text-primary mb-2">Observações</h3>
                        <Textarea
                            placeholder="Alguma observação sobre seu pedido? (Ex: sem cebola, ponto da carne, etc)"
                            className="border-gray-200"
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                        />
                    </div>

                    {/* Resumo do pedido */}
                    <div className="border-t border-gray-200 pt-4 mb-24">
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="text-primary">{formatCurrency(total)}</span>
                        </div>
                    </div>
                </>
            )}

            {/* Botões de ação fixos */}
            <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 gap-2">
                {items.length > 0 ? (
                    <>
                        <Button
                            onClick={submitOrder}
                            disabled={isSubmitting || items.length === 0}
                            variant="default"
                            className="flexx items-center gap-2 px-6 py-3 rounded-full bg-primary text-secondary shadow-lg flex-1"
                        >
                            {isSubmitting ? (
                                "Enviando..."
                            ) : (
                                <>
                                    <Send size={18} />
                                    <span>
                                        {orderType === 'local' ? 'Fazer pedido' : 'Finalizar'} •
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
                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-secondary shadow-lg w-full max-w-md"
                    >
                        Voltar ao cardápio
                    </Button>
                )}
            </div>

            {/* Diálogo de confirmação */}
            <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Finalizar pedido?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ao solicitar o fechamento da conta, um atendente virá até sua mesa para o pagamento.
                            {items.length > 0 && (
                                <p className="mt-2 text-sm">
                                    Você ainda tem itens no carrinho. Deseja enviá-los antes de finalizar?
                                </p>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isFinalizingOrder}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={finalizeOrder}
                            disabled={isFinalizingOrder}
                            className="bg-primary text-white hover:bg-primary/90"
                        >
                            {isFinalizingOrder ? "Solicitando..." : "Solicitar conta"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}



