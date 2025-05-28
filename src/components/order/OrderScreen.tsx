import React, { useEffect, useState } from "react";
import { useOrderStore, useCartStore } from "@/stores";
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
import { formatCurrency } from "@/services/restaurant/services";
import { extractIdFromSlug } from "@/utils/slugify";
import { Label } from "../ui/label";
import { ArrowLeft, RefreshCw } from "lucide-react";

const OrdersScreen = () => {
    const router = useRouter();
    const { slug, tableId } = useParams();
    const { order, requestCheckout, fetchGuestOrders } = useOrderStore();
    const { getGuestId } = useCartStore();
    const guestId = getGuestId();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showFinishDialog, setShowFinishDialog] = useState(false);
    const [isFinalizingOrder, setIsFinalizingOrder] = useState(false);
    const [splitCount, setSplitCount] = useState(1);

    const restaurantId = slug && extractIdFromSlug(String(slug));

    useEffect(() => {
        if (guestId && tableId) {
            fetchGuestOrders(guestId, String(tableId));
        }
    }, [guestId, tableId]);

    const handleCheckout = async () => {
        if (!guestId || !tableId) {
            console.error("Informações incompletas para fechamento");
            return;
        }

        setIsFinalizingOrder(true);
        try {
            await requestCheckout(String(tableId), String(restaurantId), String(guestId));
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
            await fetchGuestOrders(String(guestId), String(tableId));
            console.log('Atualização concluída');
        } catch (error) {
            console.error('Erro na atualização manual:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const totalAmount = order[0]?.status === "cancelled" ? 0 : order.reduce((total, item) => total + item.totalAmount, 0);
    const dividedAmount = totalAmount / splitCount;

    return (
        <div className="container mx-auto px-4 py-6 max-w-2xl">
            <div className="flex flex-row gap-2 justify-between items-center mb-6">
                <div className="flex flex-row items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
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
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Atualizando...' : ''}
                    </Button>
                </div>
            </div>

            {order.length === 0 ? (
                <div className="text-center mt-8">
                    <p>Nenhum pedido encontrado.</p>
                </div>
            ) : (
                <div className="mt-4">
                    {order.map((order) => (
                        <OrderCard
                            key={order._id}
                            order={{
                                ...order,
                                items: order.items.map((item) => ({
                                    ...item,
                                    imageUrl: item.image ?? item.image ?? "",
                                    guestId: order.guestInfo?.id ?? "",
                                })),
                                createdAt:
                                    typeof order.createdAt === "string"
                                        ? order.createdAt
                                        : order.createdAt?.toISOString?.() ?? "",
                            }}
                            onStatusUpdate={() => fetchGuestOrders(String(guestId), String(tableId))}
                        />
                    ))}
                    <div className="w-full mt-4 flex flex-col items-centerspace-x-2">
                        <div className="flex flex-row items-center justify-between">
                            <Label className="text-sm font-normal text-gray-700">Dividir conta por:</Label>
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
                        <div className="mt-4 flex flex-row w-full justify-between">
                            <Label className="text-sm text-gray-600">Valor por pessoa:</Label>
                            <span>{formatCurrency(dividedAmount)}</span>
                        </div>
                    </div>

                    <div className="w-full flex flex-col mt-6 gap-4">
                        <div className="flex flex-row font-bold justify-between">
                            <Label className="text-md">Total:</Label>
                            <span className="text-md">
                                {formatCurrency(totalAmount)}
                            </span>
                        </div>
                    </div>

                    <div className="mt-8 w-full flex flex-row items-center justify-end">
                        <Button onClick={() => setShowFinishDialog(true)} className="mt-4">
                            Fechar a Conta
                        </Button>
                    </div>
                </div>
            )}

            <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
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