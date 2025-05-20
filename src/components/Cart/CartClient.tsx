'use client';

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, ShoppingCart, Minus, Plus, Users, RefreshCw } from "lucide-react";
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
import { CartItemProps, useCartStore, useOrderStore } from "@/stores";
import { extractIdFromSlug } from "@/utils/slugify";

export function CartClient() {
    const router = useRouter();
    const { slug, tableId, unitId } = useParams();
    const { createOrder, fetchTableOrders } = useOrderStore();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [observations, setObservations] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionSuccess, setSubmissionSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [orderType, setOrderType] = useState<'local' | 'takeaway'>('local');
    const [showFinishDialog, setShowFinishDialog] = useState(false);
    const [isFinalizingOrder, setIsFinalizingOrder] = useState(false);
    const [splitCount, setSplitCount] = useState(1);

    const restaurantId = slug && extractIdFromSlug(String(slug));

    // Usando o CartStore
    const {
        guestInfo,
        items,
        updateQuantity,
        removeItem,
        getTotal,
        clearCart,
        restaurantId: storeRestaurantId,
        updateItemStatus
    } = useCartStore();

    useEffect(() => {
        if (restaurantId && tableId) {
            const syncOrders = async () => {
                try {
                    const orders = await fetchTableOrders(restaurantId, String(tableId));

                    // Atualizar status dos itens no carrinho
                    if (Array.isArray(orders)) {
                        orders.forEach(order => {
                            order.items.forEach((item: any) => {
                                const cartItem = items.find(cartItem => cartItem.id === item.id);
                                if (cartItem && cartItem.status !== order.status) {
                                    updateItemStatus(item.id, order.status);
                                }
                            });
                        });
                    }
                } catch (error) {
                    console.error('Erro ao sincronizar pedidos:', error);
                }
            };

            syncOrders(); // Sincronizar imediatamente
            const interval = setInterval(syncOrders, 5000); // Sincronizar a cada 5 segundos

            return () => clearInterval(interval);
        }
    }, [restaurantId, tableId, fetchTableOrders, items, updateItemStatus]);

    const handleQuantityChange = (productId: string, quantity: number) => {
        if (quantity === 0) {
            removeItem(productId);
        } else {
            updateQuantity(productId, quantity);
        }
    };

    const handleRemove = (productId: string) => {
        removeItem(productId);
    };

    const handleRefresh = async () => {
        if (!restaurantId) {
            console.log('Faltam parâmetros para atualização:', { restaurantId, tableId });
            return;
        }

        console.log('Iniciando atualização manual com:', { restaurantId, tableId });

        try {
            await fetchTableOrders(restaurantId, String(tableId));
            console.log('Atualização concluída');
        } catch (error) {
            console.error('Erro na atualização manual:', error);
        }
    };

    const total = getTotal();
    const totalPerPerson = splitCount > 1 ? total / splitCount : total;

    const goBackToMenu = () => {
        router.push(`/restaurant/${slug}/${tableId}/menu`);
    };

    const submitOrder = async () => {
        if (!tableId) {
            setError("Por favor, escaneie o QR code da mesa para fazer seu pedido.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const orderData = {
                restaurantUnitId: restaurantId || unitId,
                items: items.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image,
                    status: item.status,
                })),
                totalAmount: total,
                meta: {
                    tableId: parseInt(String(tableId)),
                    splitCount,
                    observations,
                    orderType,
                },
                guestInfo: {
                    name: guestInfo?.name || "",
                }
            };

            await createOrder(orderData, String(slug), String(tableId));
            setObservations(observations || "");
            setIsSubmitting(false);
            setSubmissionSuccess(true);

            setTimeout(() => {
                setSubmissionSuccess(false);
                router.push(`/restaurant/${slug}/${tableId}/menu`);
            }, 3000);
        } catch (error) {
            console.error("Erro ao enviar pedido:", error);
            setIsSubmitting(false);
            setError("Ocorreu um erro ao enviar seu pedido. Por favor, tente novamente.");
        }
    };

    const finalizeOrder = async () => {
        if (!tableId) {
            setError("Não foi possível identificar sua mesa.");
            return;
        }

        setIsFinalizingOrder(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setShowFinishDialog(false);
            clearCart();
            router.push(`/restaurant/${slug}/${tableId}/payment-requested`);
        } catch (error) {
            console.error("Erro ao finalizar conta:", error);
            setError("Ocorreu um erro ao solicitar o fechamento. Por favor, chame um atendente.");
        } finally {
            setIsFinalizingOrder(false);
        }
    };

    if (items.length === 0 && !submissionSuccess && !isSubmitting) {
        return (
            <div className="container mx-auto px-4 py-6 max-w-2xl">
                <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="mx-auto mb-3 text-gray-300" size={40} />
                    <p>Seu carrinho está vazio</p>
                    <Button
                        variant="link"
                        onClick={goBackToMenu}
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
                    <p className="text-gray-500 mb-4">{orderType === 'local' ? 'Um atendente trará seu pedido em breve.' : 'Seu pedido para viagem estará pronto em breve.'}</p>
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
                    onClick={goBackToMenu}
                >
                    <ArrowLeft />
                </Button>
                <h1 className="text-xl font-bold text-primary">Seu pedido</h1>
            </div>

            {tableId && (
                <div className="flex flex-row justify-between items-center mb-6">
                    <p className="text-gray-500 text-md mb-2">Mesa {tableId}</p>
                    <Button
                        onClick={handleRefresh}
                        className="flex items-center gap-2"
                        variant="outline"
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Atualizando...' : 'Atualizar Pedidos'}
                    </Button>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            {/* Lista de itens no carrinho */}
            <div className="space-y-2 mb-6">
                {items.length > 0 ? (
                    items.map((item: CartItemProps) => (
                        <CartItem
                            key={item.id}
                            id={item.id}
                            name={item.name}
                            imageUrl={item.image}
                            price={item.price}
                            quantity={item.quantity || 0}
                            status={item.status || 'pending'}
                            onQuantityChange={handleQuantityChange}
                            onRemove={handleRemove}
                        />
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <ShoppingCart className="mx-auto mb-3 text-gray-300" size={40} />
                        <p>Seu carrinho está vazio</p>
                        <Button
                            variant="link"
                            onClick={goBackToMenu}
                            className="mt-2"
                        >
                            Adicionar itens
                        </Button>
                    </div>
                )}
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
                                <Label htmlFor="local" className="cursor-pointer">Consumir no local</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="takeaway" id="takeaway" />
                                <Label htmlFor="takeaway" className="cursor-pointer">Para viagem</Label>
                            </div>
                        </RadioGroup>
                    </div>

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

                        <div className="flex justify-between font-medium text-lg mt-4">
                            <span className="text-primary">
                                {splitCount > 1 ? `Total (por pessoa)` : `Total`}
                            </span>
                            <span className="text-primary">
                                {splitCount > 1
                                    ? `${formatCurrency(totalPerPerson)} × ${splitCount}`
                                    : formatCurrency(total)}
                            </span>
                        </div>
                    </div>
                </>
            )}

            {/* Botões de ação - fixos na parte inferior */}
            <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 gap-2">
                {items.length > 0 && (
                    <>
                        {orderType === 'local' && (
                            <Button
                                onClick={() => setShowFinishDialog(true)}
                                variant="outline"
                                className="px-4 py-3 rounded-full shadow-sm w-2/5"
                            >
                                Pedir a conta
                            </Button>
                        )}

                        <Button
                            onClick={submitOrder}
                            disabled={isSubmitting || items.length === 0 || !tableId}
                            variant="default"
                            className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-secondary shadow-lg flex-1"
                        >
                            {isSubmitting ? (
                                "Enviando..."
                            ) : (
                                <>
                                    <Send size={18} />
                                    <span>{orderType === 'local' ? 'Fazer pedido' : 'Finalizar'} • {formatCurrency(splitCount > 1 ? totalPerPerson : total)}</span>
                                </>
                            )}
                        </Button>
                    </>
                )}

                {items.length === 0 && !submissionSuccess && (
                    <Button
                        onClick={goBackToMenu}
                        variant="default"
                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-secondary shadow-lg w-full max-w-md"
                    >
                        Voltar ao cardápio
                    </Button>
                )}
            </div>

            {/* Diálogo de confirmação para finalizar a conta */}
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

