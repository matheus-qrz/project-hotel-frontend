'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CartItemProps, useCartStore } from '@/stores/cart';
import { useProductStore } from '@/stores/products';
import ProductCard from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { extractNameFromSlug } from '@/utils/slugify';
import { getCategoryName } from '@/utils/getCategoryName';
import { DelayedLoading } from '../loading/DelayedLoading';
import { useAuthStore } from '@/stores';

interface MenuClientProps {
  slug: string;
  initialCategories: string[];
}

export default function MenuClient({
  slug,
  initialCategories
}: MenuClientProps) {
  const { tableId } = useParams();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const restaurantName = slug && extractNameFromSlug(String(slug));

  const { items, addItem, updateQuantity, removeItem, getTotal } = useCartStore();
  const { products, loading: isLoading } = useProductStore();
  const { guestInfo } = useAuthStore();

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = getTotal();

  const handleQuantityChange = (id: string, newQuantity: number) => {
    const product = products.find(p => p._id === id);
    if (!product) return;

    if (newQuantity === 0) {
      removeItem(id);
    } else {
      const cartItem: CartItemProps = {
        id: product._id ?? '',
        name: product.name,
        price: product.price,
        quantity: newQuantity,
        image: product.image ?? '',
        status: 'pending',
      };

      const existingItem = items.find(item => item.id === id);
      if (existingItem) {
        updateQuantity(id, newQuantity);
      } else {
        addItem(cartItem);
      }
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter(product => product.category === selectedCategory)
    : products;

  const goToCart = () => {
    router.push(`/restaurant/${slug}/${tableId}/cart`);
  };

  if (isLoading) return <DelayedLoading />;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className='flex flex-col gap-2 mb-4'>
          <h1 className="text-2xl font-bold">{restaurantName}</h1>
          <p className="text-gray-600">Olá, {guestInfo?.name}! Selecione os produtos que deseja adicionar ao seu pedido.</p>
        </div>

        <div className="flex flex-row gap-2 overflow-auto">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(null)}
          >
            Ver todos
          </Button>
          {initialCategories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category)}
            >
              {getCategoryName(category)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-6 mb-8">
        {selectedCategory === null ? (
          initialCategories.map(category => {
            const categoryProducts = products.filter(product => product.category === category);
            if (categoryProducts.length === 0) return null;

            return (
              <div key={category} className="mb-8">
                <h2 className="text-xl font-semibold mb-4">{getCategoryName(category)}</h2>
                <div className="grid grid-cols-1 gap-3">
                  {categoryProducts.map(product => {
                    const cartItem = items.find(item => item.id === product._id);
                    const quantity = cartItem ? cartItem.quantity : 0;

                    return (
                      <ProductCard
                        key={product._id}
                        product={product}
                        quantity={quantity}
                        onQuantityChange={handleQuantityChange}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredProducts.map(product => {
              const cartItem = items.find(item => item.id === product._id);
              const quantity = cartItem ? cartItem.quantity : 0;

              return (
                <ProductCard
                  key={product._id}
                  product={product}
                  quantity={quantity}
                  onQuantityChange={handleQuantityChange}
                />
              );
            })}
          </div>
        )}
      </div>

      {totalItems > 0 && (
        <Button
          onClick={goToCart}
          variant="default"
          className="fixed bottom-4 left-4 right-4 w-[calc(100%-32px)] bg-black hover:bg-black text-white py-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Ver Carrinho</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/80">{totalItems} itens</span>
            <span className="font-medium">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
          </div>
        </Button>
      )}
    </div>
  );
}