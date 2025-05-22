// components/orders/OrdersScreen.tsx
import React, { useEffect, useState } from "react";
import { useOrderStore, useCartStore } from "@/stores";
import { OrderCard } from "../order/OrderCard";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"; // Importe os componentes necessários
import { useParams, useRouter } from "next/navigation";
import { extractIdFromSlug } from "@/utils/slugify";
import { Button } from "../ui/button";

const OrdersScreen = () => {
    const router = useRouter();
    const { slug, tableId } = useParams();
    const { order, requestCheckout, fetchTableOrders } = useOrderStore();
    const { getGuestId } = useCartStore();
    const guestId = getGuestId();
    const [showFinishDialog, setShowFinishDialog] = useState(false);
    const [isFinalizingOrder, setIsFinalizingOrder] = useState(false);

    const restaurantId = slug && extractIdFromSlug(String(slug));

    useEffect(() => {
        if (guestId) {
            // Carregar pedidos ao montar o componente
            fetchTableOrders(String(restaurantId), String(tableId), guestId);
        }
    }, [guestId]);

    const handleCheckout = async () => {
        setIsFinalizingOrder(true);
        try {
            await requestCheckout(String(tableId), String(guestId), String(restaurantId));
            // Adicione lógica para lidar com sucesso
        } catch (error) {
            console.error("Erro ao solicitar fechamento:", error);
            // Adicione lógica para lidar com erro
        } finally {
            setIsFinalizingOrder(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-6 max-w-2xl">
            <div className="flex items-center mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    Voltar
                </Button>
                <h1 className="text-xl font-bold text-primary">Meus Pedidos</h1>
            </div>

            {order.length === 0 ? (
                <p>Nenhum pedido encontrado.</p>
            ) : (
                <div className="mt-4">
                    {order.map((order) => (
                        <OrderCard
                            key={order._id}
                            order={{
                                ...order,
                                items: order.items.map(item => ({
                                    ...item,
                                    imageUrl: item.image ?? item.image ?? "",
                                    guestId: order.guestInfo?.id ?? ""
                                })),
                                createdAt: typeof order.createdAt === "string" ? order.createdAt : order.createdAt?.toISOString?.() ?? ""
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Botão para fechar a conta */}
            <Button onClick={() => setShowFinishDialog(true)} className="mt-4">
                Fechar a Conta
            </Button>

            {/* Diálogo de confirmação para fechar a conta */}
            <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Fechar Conta</AlertDialogTitle>
                        <AlertDialogDescription>
                            Você tem certeza que deseja fechar a conta? Um atendente virá até você para o pagamento.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isFinalizingOrder}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCheckout} disabled={isFinalizingOrder}>
                            {isFinalizingOrder ? "Solicitando..." : "Fechar Conta"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default OrdersScreen;