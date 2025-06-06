import React, { useState } from 'react';
import { useProductStore } from '@/stores/products';
import { useCartStore } from '@/stores/cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

const PreOrderScreen = () => {
    const { slug, tableId } = useParams()
    const router = useRouter();
    const { selectedProduct } = useProductStore();
    const { items, addItem, updateItemAddons, updateQuantity } = useCartStore();
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

    if (!selectedProduct) return <div>Produto não encontrado.</div>;

    const handleAddToCart = () => {
        // Filtrar addons selecionados
        const addonsToAdd = selectedProduct.additionalOptions?.filter(addon =>
            selectedAddons.includes(addon.id)
        ) || [];

        // Verificar se o item já está no carrinho
        const existingItem = items.find(item => item._id === selectedProduct._id);

        if (existingItem) {
            // Atualizar o item existente com a nova quantidade e addons
            updateQuantity(selectedProduct._id ?? '', existingItem.quantity + 1);
            updateItemAddons(selectedProduct._id ?? '', addonsToAdd);
        } else {
            // Adicionar novo item ao carrinho
            addItem({
                _id: selectedProduct._id ?? '',
                name: selectedProduct.name,
                price: selectedProduct.price,
                quantity: 1,
                image: selectedProduct.image ?? '',
                status: "pending",
                addons: addonsToAdd,
            });
        }

        router.push(`/restaurant/${slug}/${tableId}/cart`);
    };

    const toggleAddonSelection = (addonId: string) => {
        setSelectedAddons(prevState =>
            prevState.includes(addonId)
                ? prevState.filter(id => id !== addonId)
                : [...prevState, addonId]
        );
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <div className="flex items-center mb-4">
                <Button variant="outline" onClick={() => router.back()} className="mr-2">
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <h1 className="text-xl font-semibold">Adicionais</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className='text-primary'>{selectedProduct.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    {selectedProduct.image && (
                        <img
                            src={selectedProduct.image}
                            alt={selectedProduct.name}
                            className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                    )}

                    {selectedProduct.additionalOptions && selectedProduct.additionalOptions.length > 0 && (
                        <div className="mb-4">
                            <h3 className="text-lg font-medium mb-2">Adicionais</h3>
                            <ul className="space-y-2">
                                {selectedProduct.additionalOptions.map((addon) => (
                                    <li key={addon.id} className="flex justify-between items-center bg-gray-100 p-2 rounded-lg">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedAddons.includes(addon.id)}
                                                onChange={() => toggleAddonSelection(addon.id)}
                                                className="form-checkbox h-5 w-5 text-indigo-600"
                                            />
                                            <span>{addon.name}</span>
                                        </label>
                                        <span className="text-sm text-gray-600">+ R$ {addon.price.toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {selectedProduct.accompaniments && selectedProduct.accompaniments.length > 0 && (
                        <div className="mb-4">
                            <h3 className="text-lg font-medium mb-2">Acompanhamentos</h3>
                            <ul className="space-y-2">
                                {selectedProduct.accompaniments.map((accompaniment, index) => (
                                    <li key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded-lg">
                                        <span>{accompaniment.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <Button onClick={handleAddToCart} className="w-full mt-4">
                        Adicionar ao Carrinho
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default PreOrderScreen;