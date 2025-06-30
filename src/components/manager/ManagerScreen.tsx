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

interface OrderItemState {
    id: string;
    name: string;
    quantity: number;
    status: OrderItemStatusType;
    addons?: Addon[];
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

export function ManagerScreen({ slug }: ManagerScreenProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { order, fetchRestaurantUnitOrders, updateOrder } = useOrderStore();
    const { currentUnitId } = useRestaurantUnitStore();
    const [previousOrders, setPreviousOrders] = useState<{ [key: string]: OrderItem[] }>({});

    const restaurantId = slug && extractIdFromSlug(String(slug));

    const getStatusColor = (status: OrderStatusType) => StatusColors[status];
    const getStatusText = (status: OrderStatusType) => StatusTexts[status];

    useEffect(() => {
        const loadOrders = async () => {
            if (restaurantId && currentUnitId) {
                try {
                    await fetchRestaurantUnitOrders(restaurantId, String(currentUnitId));
                } catch (error) {
                    console.error('Error fetching orders:', error);
                }
            }
        };

        loadOrders();
    }, [restaurantId, currentUnitId, fetchRestaurantUnitOrders]);

    useEffect(() => {
        const newPreviousOrders: { [key: string]: OrderItem[] } = {};
        order.forEach(orderItem => {
            const key = `${orderItem.meta.tableId}-${orderItem.guestInfo.id}`;
            newPreviousOrders[key] = orderItem.items.map(item => ({
                ...item,
                id: item._id,
                guestId: orderItem.guestInfo.id,
                addons: item.addons ? item.addons.filter(addon => typeof addon !== 'string') as Addon[] : undefined
            }));
        });
        setPreviousOrders(newPreviousOrders);
    }, [order]);

    const handleRefresh = async () => {
        if (!restaurantId) return;
        setIsRefreshing(true);
        try {
            // Armazena o snapshot antes da atualização
            const previousOrderSnapshot = JSON.parse(JSON.stringify(order));

            // Busca os novos pedidos
            await fetchRestaurantUnitOrders(restaurantId, currentUnitId ? String(currentUnitId) : '');

            // Atualiza previousOrders com os dados corretos
            setPreviousOrders(() => {
                const newPreviousOrders: { [key: string]: OrderItem[] } = {};
                previousOrderSnapshot.forEach((orderItem: Order) => {
                    const key = `${orderItem.meta.tableId}-${orderItem.guestInfo.id}`;
                    newPreviousOrders[key] = orderItem.items.map(item => ({
                        ...item,
                        id: item._id,
                        guestId: orderItem.guestInfo.id,
                        addons: item.addons ? [...item.addons] : undefined // keep as string[] or undefined
                    }));
                });
                return newPreviousOrders;
            });
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

    const renderOrderItems = (order: Order) => {
        const previousItems = previousOrders[`${order.meta.tableId}-${order.guestInfo.id}`] || [];

        return order.items.map(item => {
            const isPreviouslySeen = previousItems.some(prev => prev._id === item._id);

            // Considera "novo" se não foi visto antes E o pedido já tinha sido exibido anteriormente
            const isNew =
                !isPreviouslySeen &&
                item.createdAt &&
                (!order.updatedAt || new Date(item.createdAt) > new Date(order.updatedAt));

            let style = '';
            let prefix = '';

            switch (order.status) {
                case OrderStatus.COMPLETED:
                    style = 'text-gray-900 line-through';
                    break;

                case OrderStatus.PAYMENT_REQUESTED:
                    style = 'text-purple-600';
                    break;

                case OrderStatus.PROCESSING:
                    if (isNew) {
                        style = 'text-green-600 font-medium';
                        prefix = '+';
                    } else if (item.status === OrderItemStatus.COMPLETED) {
                        style = 'text-gray-900 line-through';
                    } else if (
                        item.status === OrderItemStatus.REMOVED ||
                        item.status === OrderItemStatus.CANCELLED
                    ) {
                        style = 'text-red-600';
                        prefix = '-';
                    } else {
                        style = 'text-gray-600';
                    }
                    break;

                default:
                    style = 'text-gray-600';
            }

            return (
                <div key={item._id} className="mb-2">
                    <li className={`${style} flex flex-col`}>
                        <span>{prefix}{Math.abs(item.quantity)}x {item.name}</span>
                        {item.addons && item.addons.length > 0 && (
                            <ul className="ml-6 text-sm">
                                {item.addons.map((addon, index) => (
                                    <li key={index} className={`${style} italic`}>
                                        {prefix}{Math.abs(addon.quantity || 1)}x {addon.name}
                                        {addon.price > 0 && ` (+R$ ${addon.price.toFixed(2)})`}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                </div>
            );
        });
    };


    const renderOrders = (statuses: OrderStatusType[]) => {
        const groupedOrders = groupOrders();

        return groupedOrders
            .filter(order => statuses.includes(order.status))
            .map(order => (
                <Card key={order._id} className="mb-4">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center text-primary text-xl font-semibold">
                            <span>Mesa {order.meta.tableId}</span>
                            <Select
                                value={order.status}
                                onValueChange={(value) => handleStatusChange(order._id, value as OrderStatusType)}
                                disabled={order.status === OrderStatus.PAID || order.status === OrderStatus.CANCELLED}
                            >
                                <SelectTrigger className={`w-[180px] ${getStatusColor(order.status)}`}>
                                    <SelectValue>
                                        {getStatusText(order.status)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(OrderStatus).map((key) => (
                                        <SelectItem
                                            key={key}
                                            value={OrderStatus[key as keyof typeof OrderStatus]}
                                        >
                                            {StatusTexts[OrderStatus[key as keyof typeof OrderStatus]]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p><strong>Cliente:</strong> {order.guestInfo?.name || 'Anônimo'}</p>
                            <p><strong>Itens:</strong></p>
                            <ul>
                                {renderOrderItems(order)}
                            </ul>
                            <p><strong>Total:</strong> R$ {order.totalAmount.toFixed(2)}</p>
                            {order.meta?.observations && (
                                <p><strong>Observações:</strong> {order.meta.observations}</p>
                            )}
                            {order.meta?.orderType && (
                                <p><strong>Tipo:</strong> {order.meta.orderType === 'local' ? 'Local' : 'Para Viagem'}</p>
                            )}
                            {order.meta?.splitCount && order.meta.splitCount > 1 && (
                                <p><strong>Divisão:</strong> {order.meta.splitCount} pessoas</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ));
    };

    return (
        <div className="w-full max-h-screen overflow-hidden bg-gray-50">
            <div className="w-full mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Gerenciamento de Pedidos</h1>
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

                <div className="grid grid-cols-3 md:grid-cols-3 gap-6 justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-sm min-h-[calc(100vh-200px)] overflow-y-auto">
                        <h2 className="text-xl font-semibold mb-6 sticky top-0 bg-white py-2">
                            Em Preparo
                        </h2>
                        <div className="space-y-4">
                            {renderOrders([OrderStatus.PROCESSING])}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm min-h-[calc(100vh-200px)] overflow-y-auto">
                        <h2 className="text-xl font-semibold mb-6 sticky top-0 bg-white py-2">
                            Concluídos
                        </h2>
                        <div className="space-y-4">
                            {renderOrders([OrderStatus.COMPLETED])}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm min-h-[calc(100vh-200px)] overflow-y-auto">
                        <h2 className="text-xl font-semibold mb-6 sticky top-0 bg-white py-2">
                            Pagamentos Solicitados
                        </h2>
                        <div className="space-y-4">
                            {renderOrders([OrderStatus.PAYMENT_REQUESTED])}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ManagerScreen;



