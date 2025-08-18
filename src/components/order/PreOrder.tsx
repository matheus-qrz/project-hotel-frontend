import React, { useState, useEffect } from 'react';
import { useProductStore } from '@/stores/products';
import { useCartStore } from '@/stores/cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

interface Addon {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface AddonQuantity {
    itemId: string;
    itemIndex: number;
    id: string;
    quantity: number;
}

export const PreOrderScreen = () => {
    const { slug, tableId } = useParams()
    const router = useRouter();
    const { products } = useProductStore();
    const { items, updateItemAddons } = useCartStore();
    const [addonQuantities, setAddonQuantities] = useState<AddonQuantity[]>([]);

    // Filtrar apenas itens que podem ter adicionais
    const itemsWithAddons = items.filter(item => {
        const product = products.find(p => p._id === item._id);
        return product && ((product.additionalOptions?.length ?? 0) > 0 || (product.accompaniments?.length ?? 0) > 0);
    });

    const getProductDetails = (itemId: string) => {
        return products.find(p => p._id === itemId);
    };

    const handleAddToCart = () => {
        // Atualizar cada item com seus addons selecionados
        itemsWithAddons.forEach((item, itemIndex) => {
            const product = getProductDetails(item._id);
            if (!product) return;

            const itemAddons = (
                product.additionalOptions
                    ?.map(addon => {
                        const quantity = addonQuantities.find(
                            aq =>
                                aq.itemId === item._id &&
                                aq.itemIndex === itemIndex &&
                                aq.id === addon.id
                        )?.quantity || 0;

                        return quantity > 0
                            ? {
                                id: addon.id,
                                name: addon.name,
                                price: addon.price,
                                quantity
                            }
                            : null;
                    })
                    .filter((addon): addon is Addon => addon !== null)
            ) || [];

            updateItemAddons(item._id, itemAddons);
        });

        router.push(`/restaurant/${slug}/${tableId}/cart`);
    };

    const updateAddonQuantity = (itemId: string, itemIndex: number, addonId: string, increment: boolean) => {
        setAddonQuantities(prev => {
            const existing = prev.find(
                item => item.itemId === itemId &&
                    item.itemIndex === itemIndex &&
                    item.id === addonId
            );

            if (!existing) {
                if (increment) {
                    return [...prev, { itemId, itemIndex, id: addonId, quantity: 1 }];
                }
                return prev;
            }

            return prev.map(item => {
                if (item.itemId === itemId &&
                    item.itemIndex === itemIndex &&
                    item.id === addonId) {
                    const newQuantity = increment ? item.quantity + 1 : Math.max(0, item.quantity - 1);
                    return { ...item, quantity: newQuantity };
                }
                return item;
            });
        });
    };

    const getAddonQuantity = (itemId: string, itemIndex: number, addonId: string): number => {
        return addonQuantities.find(
            item => item.itemId === itemId &&
                item.itemIndex === itemIndex &&
                item.id === addonId
        )?.quantity || 0;
    };

    if (itemsWithAddons.length === 0) {
        router.push(`/restaurant/${slug}/${tableId}/cart`);
        return null;
    }

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            <div className="flex items-center mb-4 py-5">
                <Button variant="outline" onClick={() => router.back()} className="mr-2">
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <h1 className="text-xl font-semibold">Personalizar Pedido</h1>
            </div>

            {itemsWithAddons.map((item, itemIndex) => {
                const product = getProductDetails(item._id);
                if (!product) return null;

                return (
                    <Card key={`${item._id}-${itemIndex}`} className="mb-4">
                        <CardHeader>
                            <CardTitle className='text-primary'>
                                {item.name} #{itemIndex + 1}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {product.additionalOptions && product.additionalOptions.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-lg font-medium mb-2">Adicionais</h3>
                                    <ul className="space-y-2">
                                        {product.additionalOptions.map((addon) => (
                                            <li key={addon.id} className="flex justify-between items-center bg-gray-100 p-2 rounded-lg">
                                                <span>{addon.name}</span>
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-sm text-gray-600">
                                                        + R$ {addon.price.toFixed(2)}
                                                    </span>
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => updateAddonQuantity(item._id, itemIndex, addon.id, false)}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                        <span className="w-8 text-center">
                                                            {getAddonQuantity(item._id, itemIndex, addon.id)}
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => updateAddonQuantity(item._id, itemIndex, addon.id, true)}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {product.accompaniments && product.accompaniments.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-lg font-medium mb-2">Acompanhamentos</h3>
                                    <ul className="space-y-2">
                                        {product.accompaniments.map((accompaniment, index) => (
                                            <li key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded-lg">
                                                <span>{accompaniment.name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}

            <Button onClick={handleAddToCart} className="w-full mt-4">
                Adicionar ao Carrinho
            </Button>
        </div>
    );
};
