'use client';

import { useEffect, useState } from 'react';
import { useOrderStore, useRestaurantUnitStore, useTableStore } from '@/stores';
import { extractIdFromSlug } from '@/utils/slugify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Order, OrderItem } from '@/stores/order';
import { OrderStatus, OrderItemStatus, OrderStatusType, OrderItemStatusType } from '@/stores/order/types/order.types';

interface ManagerScreenProps {
    slug: string;
}

interface Addon {
    id: string;
    name: string;
    price: number;
    quantity?: number;
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
    const { order, fetchRestaurantUnitOrders, updateOrder } = useOrderStore();
    const { currentUnitId } = useRestaurantUnitStore();

    const restaurantId = slug && extractIdFromSlug(String(slug));

    console.log('Restaurant ID:', restaurantId);

    useEffect(() => {
        const loadOrders = async () => {
            if (restaurantId) {
                try {
                    await fetchRestaurantUnitOrders(restaurantId);
                } catch (error) {
                    console.error('Error fetching orders:', error);
                }
            } else if (currentUnitId) {
                try {
                    await fetchRestaurantUnitOrders(restaurantId, String(currentUnitId));
                } catch (error) {
                    console.error('Error fetching orders:', error);
                }
            }
        };

        loadOrders();
    }, [restaurantId, currentUnitId, fetchRestaurantUnitOrders]);

    const handleRefresh = async () => {
        if (!restaurantId) return;
        setIsRefreshing(true);
        try {
            await fetchRestaurantUnitOrders(restaurantId, String(currentUnitId));
        } catch (error) {
            console.error('Erro na atualização manual:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleStatusChange = async (orderId: string, newStatus: OrderStatusType) => {
        try {
            await updateOrder(restaurantId, String(order[0].meta.tableId), orderId, {
                status: newStatus
            });
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    };

    const groupOrders = () => {
        const groupedOrders: { [key: string]: any } = {};

        order.forEach(orderItem => {
            const key = `${orderItem.meta.tableId}-${orderItem.guestInfo.id}`;

            // Se for o primeiro pedido, inicialize
            if (!groupedOrders[key]) {
                groupedOrders[key] = { ...orderItem, items: [...orderItem.items] };
            } else {
                orderItem.items.forEach(item => {
                    const existingItem = groupedOrders[key].items.find((i: OrderItem) => i._id === item._id);
                    if (existingItem) {
                        existingItem.quantity += item.quantity; // Acumula a quantidade
                    } else {
                        groupedOrders[key].items.push(item); // Adiciona novo item
                    }
                });
                groupedOrders[key].totalAmount += orderItem.totalAmount; // Atualiza o total
                groupedOrders[key].status = 'processing'; // Retorna ao status de em andamento
            }
        });

        return Object.values(groupedOrders);
    };

    const renderOrderItems = (items: OrderItem[]) => {
        return items.map((item, index) => {
            let style = 'text-gray-600';
            let prefix = '';

            if (item.status === OrderItemStatus.ADDED) {
                style = 'text-green-600 font-medium';
                prefix = '+';
            } else if (item.status === OrderItemStatus.CANCELLED || item.status === OrderItemStatus.REMOVED) {
                style = 'text-red-600';
                prefix = '-';
            } else if (item.status === OrderItemStatus.COMPLETED) {
                style = 'text-gray-500 line-through';
            }

            return (
                <li key={index} className={`${style} flex justify-between`}>
                    <span>{prefix}{item.quantity}x {item.name}</span>
                </li>
            );
        });
    };

    const renderBadges = (order: Order) => {
        const badges = [];

        if (order.items.some(i => i.status === OrderItemStatus.ADDED)) {
            badges.push(<span key="novo" className="text-sm text-blue-600">🆕 Novo item</span>);
        }
        if (order.items.every(i => i.status === OrderItemStatus.COMPLETED)) {
            badges.push(<span key="completo" className="text-sm text-green-600">✅ Todos servidos</span>);
        }
        if (order.status === OrderStatus.PAYMENT_REQUESTED) {
            badges.push(<span key="pago" className="text-sm text-purple-600">💳 Pagamento solicitado</span>);
        }
        if (order.items.some(i => i.status === OrderItemStatus.CANCELLED)) {
            badges.push(<span key="cancelado" className="text-sm text-red-600">❗Item cancelado</span>);
        }

        return <div className="flex gap-2 flex-wrap mt-2">{badges}</div>;
    };

    const renderOrderCard = (order: Order) => (
        <Card key={order._id} className="p-3 rounded-xl shadow-sm bg-white w-full max-w-lg mx-auto">
            <CardHeader className="pb-2">
                <CardTitle className="flex flex-col items-start text-base">
                    <div className="flex justify-between w-full">
                        {renderBadges(order)}
                        <span className="font-semibold">Mesa {order.meta.tableId}</span>
                        <Select
                            value={order.status}
                            onValueChange={(value) => handleStatusChange(order._id, value as OrderStatusType)}
                            disabled={([OrderStatus.PAID, OrderStatus.CANCELLED] as OrderStatusType[]).includes(order.status)}
                        >
                            <SelectTrigger className={`w-[140px] text-sm ${StatusColors[order.status]} px-2`}>
                                <SelectValue>{StatusTexts[order.status]}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(OrderStatus).map(([key, value]) => (
                                    <SelectItem key={key} value={value}>{StatusTexts[value]}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="gap-4 text-lg">
                <p><strong>Cliente:</strong> {order.guestInfo?.name || 'Anônimo'}</p>
                <p className="mt-1"><strong>Itens:</strong></p>
                <ul className="ml-4 list-disc">
                    {renderOrderItems(order.items)}
                </ul>
                <p className="mt-1"><strong>Enviado às:</strong> {formatTime(String(order.createdAt))}</p>
                <p><strong>Total:</strong> R$ {order.totalAmount.toFixed(2)}</p>
            </CardContent>
        </Card>
    );

    const renderOrders = (status: string) => {
        return order.filter(o => o.status === status).map(renderOrderCard);
    };

    return (
        <div className="w-full max-h-screen overflow-hidden bg-gray-50">
            <div className="w-full h-screen mx-auto p-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold">Gerenciamento de Pedidos</h1>
                    <Button onClick={handleRefresh} variant="outline" disabled={isRefreshing} className="text-sm">
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Atualizando...' : 'Atualizar'}
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <h2 className="text-lg font-semibold mb-3">Em preparo</h2>
                        {renderOrders(OrderStatus.PROCESSING)}
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold mb-3">Concluídos</h2>
                        {renderOrders(OrderStatus.COMPLETED)}
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold mb-3">Pagamentos solicitados</h2>
                        {renderOrders(OrderStatus.PAYMENT_REQUESTED)}
                    </div>
                </div>
            </div>
        </div>
    );
}




