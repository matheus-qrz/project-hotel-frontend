import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart";
import { useProductStore } from "@/stores/products";
import { useGuestStore, useOrderStore } from "@/stores";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { extractNameFromSlug } from "@/utils/slugify";
import { getCategoryName } from "@/utils/getCategoryName";
import { DelayedLoading } from "../loading/DelayedLoading";

interface MenuClientProps {
  slug: string;
  initialCategories: string[];
}

const CATEGORIES = [
  { id: "accompaniments", name: "Acompanhamentos" },
  { id: "appetizers", name: "Entradas" },
  { id: "main", name: "Pratos Principais" },
  { id: "pizzas", name: "Pizzas" },
  { id: "burgers", name: "Hambúrgueres" },
  { id: "pastas", name: "Massas" },
  { id: "grills", name: "Grelhados" },
  { id: "seafood", name: "Frutos do Mar" },
  { id: "healthy", name: "Saudável" },
  { id: "sides", name: "Acompanhamentos" },
  { id: "specials", name: "Especiais" },
  { id: "vegan", name: "Vegano" },
  { id: "gluten-free", name: "Sem Glúten" },
  { id: "breakfast", name: "Café da Manhã" },
  { id: "snacks", name: "Lanches" },
  { id: "snacks2", name: "Petiscos" },
  { id: "salads", name: "Saladas" },
  { id: "addOns", name: "Adicionais" },
  { id: "soups", name: "Sopas" },
  { id: "international", name: "Internacional" },
  { id: "kids", name: "Menu Infantil" },
  { id: "cocktails", name: "Coquetéis" },
  { id: "smoothies", name: "Smoothies" },
  { id: "teas", name: "Chás" },
  { id: "coffees", name: "Cafés" },
  { id: "wines", name: "Vinhos" },
  { id: "beers", name: "Cervejas" },
  { id: "spirits", name: "Destilados" },
  { id: "drinks", name: "Bebidas" },
  { id: "desserts", name: "Sobremesas" },
];

export default function MenuClient({
  slug,
  initialCategories,
}: MenuClientProps) {
  const { tableId } = useParams();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { items, addItem, updateQuantity, removeItem, getTotal, getGuestId } =
    useCartStore();
  const {
    products,
    loading: isLoading,
    setSelectedProduct,
  } = useProductStore();
  const { guestInfo } = useGuestStore();
  const { fetchGuestOrders, order } = useOrderStore();

  const restaurantName = slug && extractNameFromSlug(String(slug));

  console.log(restaurantName);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = getTotal();

  useEffect(() => {
    const guestId = guestInfo?.id;
    if (guestId && tableId) {
      fetchGuestOrders(guestId, Number(tableId));
    }
  }, [slug, tableId, order.length]);

  const handleQuantityChange = (id: string, newQuantity: number) => {
    const product = products.find((p) => p._id === id);
    if (!product) return;

    const cartItem = {
      _id: product._id ?? "",
      name: product.name,
      price: product.price,
      costPrice: product.costPrice ?? 0,
      quantity: newQuantity,
      image: product.image ?? "",
      status: "processing" as "processing",
    };

    if (newQuantity === 0) {
      removeItem(id);
    } else {
      const existingItem = items.find((item) => item._id === id);
      if (existingItem) {
        updateQuantity(id, newQuantity);
      } else {
        addItem(cartItem);
      }
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter(
        (product) =>
          product.category === selectedCategory ||
          (product.isCombo && selectedCategory === "Combos"),
      )
    : products;

  const goToCart = () => {
    // Verifica se algum item no carrinho possui adicionais ou acompanhamentos
    const itemWithExtras = items.find((item) => {
      const product = products.find((p) => p._id === item._id);
      return (
        product &&
        ((product.additionalOptions?.length ?? 0) > 0 ||
          (product.accompaniments?.length ?? 0) > 0)
      );
    });

    if (itemWithExtras) {
      const product = products.find((p) => p._id === itemWithExtras._id);
      if (product) {
        setSelectedProduct(product);
        router.push(`/restaurant/${slug}/${tableId}/pre-order`);
      }
    } else {
      router.push(`/restaurant/${slug}/${tableId}/cart`);
    }
  };

  const goToOrders = () => {
    router.push(`/restaurant/${slug}/${tableId}/order`);
  };

  if (isLoading) return <DelayedLoading />;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="mb-4 flex flex-col gap-2">
          <div className="flex flex-row items-center justify-between">
            <h1 className="text-2xl font-bold">{restaurantName}</h1>
            <Button
              onClick={goToOrders}
              variant="default"
              className="ml-4"
            >
              Meus Pedidos
            </Button>
          </div>
          <p className="text-lg font-semibold">Olá, {guestInfo?.name}!</p>
          <p className="text-gray-500">
            {" "}
            Selecione os produtos que deseja adicionar ao seu pedido.
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-row gap-2 overflow-auto">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => setSelectedCategory(null)}
        >
          Ver todos
        </Button>
        {initialCategories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            onClick={() => setSelectedCategory(category)}
          >
            {getCategoryName(category)}
          </Button>
        ))}
        <Button
          variant={selectedCategory === "Combos" ? "default" : "outline"}
          onClick={() => setSelectedCategory("Combos")}
        >
          Combos
        </Button>
      </div>

      <div className="mb-8 space-y-6">
        {selectedCategory === null ? (
          CATEGORIES.map((category) => {
            const categoryProducts = products.filter(
              (product) =>
                product.category === category.id ||
                (product.isCombo && category.id === "Combos"),
            );
            if (categoryProducts.length === 0) return null;

            return (
              <div
                key={category.id}
                className="mb-8"
              >
                <h2 className="mb-4 text-xl font-semibold">
                  {getCategoryName(category.id)}
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {categoryProducts.map((product) => {
                    const cartItem = items.find(
                      (item) => item._id === product._id,
                    );
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
            {filteredProducts.map((product) => {
              const cartItem = items.find((item) => item._id === product._id);
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
          className="fixed bottom-4 left-4 right-4 flex w-[calc(100%-32px)] items-center justify-between bg-black py-6 text-white hover:bg-black"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Ver Carrinho</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/80">{totalItems} itens</span>
            <span className="font-medium">
              R$ {totalPrice.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </Button>
      )}
    </div>
  );
}
