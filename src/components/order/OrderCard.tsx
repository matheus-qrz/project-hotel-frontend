import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Order, OrderItem } from "./types";
import { useOrderStore } from "@/stores";
import { extractIdFromSlug } from "@/utils/slugify";
import { StatusTexts } from '../cart/constants';
import { Trash2, AlertCircle } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useParams } from 'next/navigation';

interface OrderCardProps {
    order: Order;
    className?: string;
    onStatusUpdate?: () => void;
}

export function OrderCard({ order, className, onStatusUpdate }: OrderCardProps) {
    const { slug } = useParams();
    const [isUpdating, setIsUpdating] = useState(false);
    const [itemToCancel, setItemToCancel] = useState<string | null>(null);
    const { updateOrder, cancelOrderItem } = useOrderStore();
    const [previousItems, setPreviousItems] = useState<OrderItem[]>(order.items);
    const restaurantId = slug && extractIdFromSlug(String(slug));

    useEffect(() => {
        setPreviousItems(order.items);
    }, [order.items]);

    const handleCancelOrder = async () => {
        if (!restaurantId || !order.meta.tableId) return;

        setIsUpdating(true);
        try {
            await updateOrder(String(restaurantId), String(order.meta.tableId), order._id, 'cancelled');
            onStatusUpdate?.();
        } catch (error) {
            console.error('Erro ao cancelar pedido:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancelItem = async (itemId: string) => {
        if (!restaurantId || !order.meta.tableId) return;

        setIsUpdating(true);
        try {
            await cancelOrderItem(order._id, itemId, String(restaurantId), String(order.meta.tableId));
            onStatusUpdate?.();
        } catch (error) {
            console.error('Erro ao cancelar item:', error);
        } finally {
            setIsUpdating(false);
            setItemToCancel(null);
        }
    };

    const canCancel = order.status === 'pending' || order.status === 'processing';

    const renderOrderItems = (items: OrderItem[]) => {
        return items.map(item => {
            const previousItem = previousItems.find(prev => prev.id === item.id);
            const isNew = previousItem ? item.quantity > previousItem.quantity : true;
            const colorClass = isNew ? 'text-green-600' : '';

            return (
                <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 rounded object-cover"
                        />
                        <div>
                            <h3 className={`font-medium ${colorClass}`}>{item.name}</h3>
                            <p className="text-sm text-gray-500">
                                {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                }).format(item.price)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${colorClass}`}>
                            Quantidade: {item.quantity}
                        </span>
                        {canCancel && item.status !== 'cancelled' && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700"
                                        disabled={isUpdating}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Cancelar item</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Tem certeza que deseja cancelar este item do pedido?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Não</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleCancelItem(item.id)}
                                        >
                                            Sim, cancelar item
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </div>
            );
        });
    };

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleTimeString()}
                </div>
                <Badge variant="secondary" className={cn(
                    order.status === 'pending' && "bg-yellow-200 text-yellow-800",
                    order.status === 'processing' && "bg-blue-200 text-blue-800",
                    order.status === 'completed' && "bg-green-200 text-green-800",
                    order.status === 'cancelled' && "bg-red-200 text-red-800"
                )}>
                    {StatusTexts[order.status]}
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {renderOrderItems(order.items)}
                </div>
            </CardContent>
            {canCancel && (
                <CardFooter className="flex justify-end pt-4">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={isUpdating}
                                className="flex items-center space-x-2"
                            >
                                <AlertCircle className="h-4 w-4" />
                                <span>Cancelar Pedido</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Cancelar pedido</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Tem certeza que deseja cancelar todo o pedido?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Não</AlertDialogCancel>
                                <AlertDialogAction onClick={handleCancelOrder}>
                                    Sim, cancelar pedido
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            )}
        </Card>
    );
}