'use client';

import { useEffect, useState } from 'react';
import { useOrderStore, useRestaurantUnitStore, useTableStore } from '@/stores';
import { extractIdFromSlug } from '@/utils/slugify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Order, OrderItem } from '../order/types';
import { CartItemProps } from '../cart';

interface ManagerScreenProps {
    slug: string;
}

interface OrderItemState {
    id: string;
    name: string;
    quantity: number;
    status: 'added' | 'removed' | 'updated';
}

type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'payment_requested' | 'paid';

const StatusTexts = {
    pending: 'Pendente',
    processing: 'Em preparo',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    payment_requested: 'Pagamento solicitado',
    paid: 'Pago'
};

export function ManagerScreen({ slug }: ManagerScreenProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { order, fetchRestaurantUnitOrders, updateOrder } = useOrderStore();
    const { tableId } = useTableStore();
    const { currentUnitId } = useRestaurantUnitStore();
    const [previousOrders, setPreviousOrders] = useState<{ [key: string]: OrderItem[] }>({});

    const restaurantId = slug && extractIdFromSlug(String(slug));

    useEffect(() => {
        if (restaurantId || currentUnitId) {
            fetchRestaurantUnitOrders(restaurantId, String(currentUnitId));
        }
    }, [restaurantId, currentUnitId]);

    useEffect(() => {
        const newPreviousOrders: { [key: string]: OrderItem[] } = {};
        order.forEach(orderItem => {
            const key = `${orderItem.meta.tableId}-${orderItem.guestInfo.id}`;
            newPreviousOrders[key] = orderItem.items.map(item => ({
                ...item,
                id: item._id, // Ensure 'id' is present
                guestId: orderItem.guestInfo?.id
            }));
        });
        setPreviousOrders(newPreviousOrders);
    }, [order]);

    const calculateItemDifferences = (
        previousOrderSnapshot: Order[],
        currentOrders: Order[]
    ): { [key: string]: OrderItemState[] } => {
        const differences: { [key: string]: OrderItemState[] } = {};

        currentOrders.forEach(currentOrder => {
            const previousOrder = previousOrderSnapshot.find(po => po._id === currentOrder._id);
            const itemDiff: OrderItemState[] = [];

            if (previousOrder) {
                const previousItemsMap = new Map<string, CartItemProps>();
                previousOrder.items.forEach(item => previousItemsMap.set(item.id, item));

                currentOrder.items.forEach(currentItem => {
                    const previousItem = previousItemsMap.get(currentItem.id);
                    const quantityChange = currentItem.quantity - (previousItem?.quantity || 0);

                    if (quantityChange !== 0) {
                        itemDiff.push({
                            id: currentItem.id,
                            name: currentItem.name,
                            quantity: Math.abs(quantityChange),
                            status: quantityChange > 0 ? 'added' : 'removed',
                        });
                    } else {
                        itemDiff.push({
                            id: currentItem.id,
                            name: currentItem.name,
                            quantity: currentItem.quantity,
                            status: 'updated',
                        });
                    }
                });

                previousOrder.items.forEach(previousItem => {
                    if (!currentOrder.items.find(item => item.id === previousItem.id)) {
                        itemDiff.push({
                            id: previousItem.id,
                            name: previousItem.name,
                            quantity: previousItem.quantity,
                            status: 'removed',
                        });
                    }
                });
            }

            differences[currentOrder._id] = itemDiff;
        });

        return differences;
    };

    const handleRefresh = async () => {
        if (!restaurantId) return;
        setIsRefreshing(true);
        try {
            // Snapshot dos pedidos atuais
            const previousOrderSnapshot: Order[] = JSON.parse(JSON.stringify(order));

            await fetchRestaurantUnitOrders(restaurantId, currentUnitId ? String(currentUnitId) : '');

            // Use a estrutura correta para calcular as diferenças
            const currentOrders: Order[] = JSON.parse(JSON.stringify(order));
            const differences = calculateItemDifferences(previousOrderSnapshot, currentOrders);

            setPreviousOrders(() => {
                const newPreviousOrders: { [key: string]: CartItemProps[] } = {};
                currentOrders.forEach((orderItem: Order) => {
                    const key = `${orderItem.meta.tableId}-${orderItem.guestInfo?.id}`;
                    newPreviousOrders[key] = orderItem.items.map(item => ({ ...item }));
                });
                return newPreviousOrders;
            });

            console.log('Atualização concluída: ', order);
            console.log('Diferenças calculadas: ', differences);
        } catch (error) {
            console.error('Erro na atualização manual:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const getStatusColor = (status: OrderStatus) => {
        const colors = {
            pending: 'bg-yellow-200 text-yellow-800',
            processing: 'bg-blue-200 text-blue-800',
            completed: 'bg-green-200 text-green-800',
            cancelled: 'bg-red-200 text-red-800',
            payment_requested: 'bg-purple-200 text-purple-800',
            paid: 'bg-gray-200 text-gray-800'
        };
        return colors[status];
    };

    const getStatusText = (status: OrderStatus) => {
        return StatusTexts[status];
    };

    const processOrderItems = (
        currentItems: OrderItem[],
        previousItems: OrderItem[]
    ): OrderItemState[] => {
        const itemState: OrderItemState[] = [];

        // Mapeia itens anteriores por ID para fácil acesso
        const previousItemsMap = new Map<string, OrderItem>();
        previousItems.forEach(item => previousItemsMap.set(item.id, item));

        // Processa itens atuais
        currentItems.forEach(currentItem => {
            const previousItem = previousItemsMap.get(currentItem.id);
            const quantityChange = currentItem.quantity - (previousItem?.quantity || 0);

            if (quantityChange > 0) {
                // Item adicionado ou incrementado
                itemState.push({
                    id: currentItem.id,
                    name: currentItem.name,
                    quantity: quantityChange,
                    status: 'added',
                });
            } else if (quantityChange < 0) {
                // Item decrementado
                itemState.push({
                    id: currentItem.id,
                    name: currentItem.name,
                    quantity: -quantityChange,
                    status: 'removed',
                });
            }
        });

        // Verifica itens removidos completamente
        previousItems.forEach(previousItem => {
            if (!currentItems.find(item => item.id === previousItem.id)) {
                itemState.push({
                    id: previousItem.id,
                    name: previousItem.name,
                    quantity: previousItem.quantity,
                    status: 'removed',
                });
            }
        });

        return itemState;
    };

    const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
        updateOrder(restaurantId, String(tableId), orderId, { status: newStatus });
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
                    const existingItem = groupedOrders[key].items.find((i: OrderItem) => i.id === item._id);
                    if (existingItem) {
                        existingItem.quantity += item.quantity; // Acumula a quantidade
                    } else {
                        groupedOrders[key].items.push(item); // Adiciona novo item
                    }
                });
                groupedOrders[key].totalAmount += orderItem.totalAmount; // Atualiza o total
                groupedOrders[key].status = 'pending'; // Retorna ao status pendente
            }
        });

        return Object.values(groupedOrders);
    };
    const renderOrderItems = (orderId: string, differences: { [key: string]: OrderItemState[] }) => {
        const items = differences[orderId] || []; // Garante que sempre há uma lista para iterar

        return items.map(item => {
            let colorClass;
            switch (item.status) {
                case 'removed':
                    colorClass = 'text-red-600';
                    break;
                case 'added':
                    colorClass = 'text-green-600';
                    break;
                default:
                    colorClass = 'text-gray-600';
            }

            return (
                <li key={item.id} className={colorClass}>
                    {item.status === 'removed' ? '-' : '+'}{Math.abs(item.quantity)}x {item.name}
                </li>
            );
        });
    };

    const renderOrders = (statuses: OrderStatus[]) => {
        const groupedOrders = groupOrders();

        return groupedOrders
            .filter(order => statuses.includes(order.status as OrderStatus))
            .map(order => {
                const key = `${order.meta.tableId}-${order.guestInfo.id}`;
                const previousItems = previousOrders[key] || [];
                const processedItems = processOrderItems(order.items, previousItems);

                return (
                    <Card key={order._id} className="mb-4">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center text-primary text-xl font-semibold">
                                <span>Mesa {order.meta.tableId}</span>
                                <Select
                                    value={order.status}
                                    onValueChange={(value) => handleStatusChange(order._id, value as OrderStatus)}
                                    disabled={order.status === 'paid' || order.status === 'cancelled'}
                                >
                                    <SelectTrigger className={`w-[180px] ${getStatusColor(order.status as OrderStatus)}`}>
                                        <SelectValue>
                                            {getStatusText(order.status as OrderStatus) || "Status Desconhecido"}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(StatusTexts).map((key) => (
                                            <SelectItem key={key} value={key}>
                                                {StatusTexts[key as OrderStatus]}
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
                                    {renderOrderItems(order._id, { [order._id]: processedItems })} {/* Renderiza itens processados */}
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
                );
            });
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

                <div className="grid grid-cols-4 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm min-h-[calc(100vh-200px)] overflow-y-auto">
                        <h2 className="text-lg font-semibold mb-6 sticky top-0 bg-white py-2">
                            Pendentes
                        </h2>
                        <div className="space-y-4">
                            {renderOrders(['pending'])}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm min-h-[calc(100vh-200px)] overflow-y-auto">
                        <h2 className="text-lg font-semibold mb-6 sticky top-0 bg-white py-2">
                            Em Preparo
                        </h2>
                        <div className="space-y-4">
                            {renderOrders(['processing'])}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm min-h-[calc(100vh-200px)] overflow-y-auto">
                        <h2 className="text-lg font-semibold mb-6 sticky top-0 bg-white py-2">
                            Concluídos
                        </h2>
                        <div className="space-y-4">
                            {renderOrders(['completed'])}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm min-h-[calc(100vh-200px)] overflow-y-auto">
                        <h2 className="text-lg font-semibold mb-6 sticky top-0 bg-white py-2">
                            Pagamentos Solicitados
                        </h2>
                        <div className="space-y-4">
                            {renderOrders(['payment_requested'])}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ManagerScreen;