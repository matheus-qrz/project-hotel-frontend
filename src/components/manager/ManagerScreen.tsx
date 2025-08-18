'use client';

import { useEffect, useState } from 'react';
import { useOrderStore, useRestaurantUnitStore } from '@/stores';
import { extractIdFromSlug } from '@/utils/slugify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDown, CheckCircle, Clock, RefreshCw, XCircle } from "lucide-react";
import { Order, OrderItem } from '@/stores/order';
import { OrderStatus, OrderItemStatus, OrderStatusType, OrderItemStatusType } from '@/stores/order/types/order.types';

interface ManagerScreenProps {
    slug: string;
}

function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const StatusTexts: Record<OrderStatusType, string> = {
    [OrderStatus.PROCESSING]: 'Em preparo',
    [OrderStatus.COMPLETED]: 'Concluído',
    [OrderStatus.CANCELLED]: 'Cancelado',
    [OrderStatus.PAYMENT_REQUESTED]: 'Pagamento solicitado',
    [OrderStatus.PAID]: 'Pago'
};

const StatusColors: Record<OrderStatusType, string> = {
    [OrderStatus.PROCESSING]: 'bg-blue-200 text-blue-800',
    [OrderStatus.COMPLETED]: 'bg-green-200 text-green-800',
    [OrderStatus.CANCELLED]: 'bg-red-200 text-red-800',
    [OrderStatus.PAYMENT_REQUESTED]: 'bg-purple-200 text-purple-800',
    [OrderStatus.PAID]: 'bg-gray-200 text-gray-800'
};

export default function ManagerScreen({ slug }: ManagerScreenProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { currentUnitId } = useRestaurantUnitStore();
    const {
        order,
        fetchRestaurantUnitOrders,
        updateOrderStatus,
        updateOrderItem,
        previousOrders
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

    const handleRefresh = async () => {
        if (!restaurantId) return;
        setIsRefreshing(true);
        try {
            await fetchRestaurantUnitOrders(String(restaurantId));
        } catch (error) {
            console.error('Erro na atualização manual:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleStatusChange = async (
        orderId: string,
        tableId: number,
        newStatus: OrderStatusType
    ) => {
        const targetOrder = order.find(o => o._id === orderId);
        if (!targetOrder || !restaurantId) return;

        try {
            // Atualiza o status do pedido como um todo
            await updateOrderStatus(String(restaurantId), targetOrder._id, newStatus);

            // Atualiza o status de cada item individual
            for (const item of targetOrder.items) {
                await updateOrderItem(
                    String(restaurantId),
                    Number(tableId),
                    targetOrder._id,
                    item._id,
                    { status: newStatus as OrderItemStatusType }
                );
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    };

    const renderOrderItems = (order: Order, items: OrderItem[]) => {
        return items.map((item, index) => {
            const isCancelled = item.status === "cancelled";
            const isCompleted = item.status === "completed";
            const isReduced = item.status === "reduced";

            const baseStyle = "text-md flex items-center gap-2";
            const statusClass = isCancelled
                ? "text-red-600 line-through"
                : isCompleted
                    ? "text-muted-foreground line-through"
                    : isReduced
                        ? "text-yellow-600 italic"
                        : "text-green-800";

            const statusIcon = isCancelled
                ? <XCircle size={18} className="text-red-500" />
                : isCompleted
                    ? <CheckCircle size={18} className="text-muted-foreground" />
                    : isReduced
                        ? <ArrowDown size={18} className="text-yellow-500" />
                        : <Clock size={18} className="text-green-600" />;

            return (
                <div key={index} className="px-10 mb-1">
                    <p className={`${baseStyle} ${statusClass}`}>
                        {statusIcon}
                        +{item.quantity}x {item.name}
                    </p>

                    {item.addons && item.addons.length > 0 && (
                        <ul className="ml-12 list-disc text-md text-muted-foreground">
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

        if (order.items.some(i => i.status === "added")) {
            badges.push(
                <Badge key="novo" className="bg-blue-100 text-blue-800">
                    🆕 Novo item
                </Badge>
            );
        }

        if (order.status === "cancelled") {
            badges.push(
                <Badge key="cancelado" className="bg-red-100 text-red-800">
                    ❌ Pedido cancelado
                </Badge>
            );
        }

        if (order.items.some(i => i.status === "reduced")) {
            badges.push(
                <Badge key="reduzido" className="bg-yellow-100 text-yellow-800">
                    ❗Item reduzido
                </Badge>
            );
        }

        return (
            <div className="flex gap-2 items-center">
                {badges}
            </div>
        );
    };

    const renderOrderCard = (order: Order) => (
        <Card key={order._id} className="rounded-xl shadow-md bg-white w-full max-w-lg">
            <CardHeader className="pb-2">
                <CardTitle className="flex flex-col items-start text-base space-y-1">
                    <div className="flex justify-between items-start w-full">
                        <div className="flex items-center gap-2">
                            {renderBadges(order)}
                        </div>
                        <Select
                            value={order.status}
                            onValueChange={(value) => handleStatusChange(order._id, Number(order.meta.tableId), value as OrderStatusType)}
                            disabled={([OrderStatus.PAID, OrderStatus.CANCELLED] as OrderStatusType[]).includes(order.status)}
                        >
                            <SelectTrigger className={`w-[140px] text-md ${StatusColors[order.status]} px-2`}>
                                <SelectValue>{StatusTexts[order.status]}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(OrderStatus).map(([key, value]) => (
                                    <SelectItem key={key} value={value}>{StatusTexts[value]}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <span className="text-md font-semibold text-primary">
                        Mesa {Number(order.meta.tableId)}
                    </span>
                </CardTitle>
            </CardHeader>

            <CardContent className="gap-4 text-lg pt-4">
                <p><strong>Cliente:</strong> {order.guestInfo?.name || 'Anônimo'}</p>
                <p className="mt-1"><strong>Enviado às:</strong> {formatTime(String(order.createdAt))}</p>
                <p className="mt-1"><strong>Itens:</strong></p>
                <div className="ml-4 space-y-1">
                    {renderOrderItems(order, order.items)}
                </div>
                <p className='w-full flex flex-row pt-4 justify-end'>
                    <strong>Total:</strong> R$ {order.totalAmount.toFixed(2)}
                </p>
            </CardContent>
        </Card>
    );

    const renderOrders = (status: string) => {
        return order.filter(o => o.status === status).map(renderOrderCard);
    };

    return (
        <div className="w-full max-h-screen h-full overflow-x-hidden overflow-auto bg-gray-50">
            <div className="w-full h-screen mx-auto p-4">

                {/* Cabeçalho com botão atualizar */}
                <div className="flex justify-between items-center mb-4 px-6">
                    <h1 className="text-xl font-bold">Gerenciamento de Pedidos</h1>
                    <Button
                        onClick={handleRefresh}
                        variant="outline"
                        disabled={isRefreshing}
                        className="text-sm"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Atualizando...' : 'Atualizar'}
                    </Button>
                </div>

                {/* Grid com 3 colunas fixas */}
                <div className="grid grid-cols-3 gap-6 px-6 items-start">
                    {/* Em preparo */}
                    <div className="flex flex-col gap-y-4 min-h-[500px]">
                        <h2 className="text-lg font-semibold mb-4 border-r border-gray-400">Em preparo</h2>
                        {renderOrders(OrderStatus.PROCESSING)}
                    </div>

                    {/* Concluídos */}
                    <div className="flex flex-col gap-y-4 min-h-[500px]">
                        <h2 className="text-lg font-semibold mb-4 border-r border-gray-400">Concluídos</h2>
                        {renderOrders(OrderStatus.COMPLETED)}
                    </div>

                    {/* Pagamentos solicitados */}
                    <div className="flex flex-col gap-y-4 min-h-[500px]">
                        <h2 className="text-lg font-semibold mb-4">Pagamentos solicitados</h2>
                        {renderOrders(OrderStatus.PAYMENT_REQUESTED)}
                    </div>
                </div>
            </div>
        </div>
    );
}
