// pages/restaurant/[slug]/promotions/index.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Product, useProductStore } from "@/stores/products";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PromotionCard } from "./PromotionCard";
import { CategoryPromotionSection } from "./CategoryPromotionSession";
import { useParams, useRouter } from "next/navigation";
import { extractIdFromSlug } from "@/utils/slugify";
import { useToast } from "@/hooks/useToast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "../ui/card";
import { CircleDollarSign } from "lucide-react";

export default function PromotionsPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { products, deactivatePromotion, fetchProducts } = useProductStore();
  const [activeTab, setActiveTab] = useState("active");
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const restaurantId = slug ? extractIdFromSlug(String(slug)) : null;

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      if (!restaurantId || !isMounted) return;

      try {
        setIsLoading(true);
        await fetchProducts(restaurantId);
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching products:", error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [restaurantId]);

  if (!restaurantId) {
    return (
      <div className="container mx-auto p-6">ID do restaurante inválido</div>
    );
  }

  const activePromotions = products?.filter((p) => p.isOnPromotion) || [];
  const categories = Array.from(
    new Set(products?.map((p) => p.category) || []),
  );

  const handleEditPromotion = (product: Product) => {
    router.push(
      `/admin/restaurant/${product.restaurant}/promotions/${product._id}/promotion`,
    );
  };

  const handleDeactivatePromotion = (productId: string) => {
    setSelectedProductId(productId);
    setIsDeactivateDialogOpen(true);
  };

  const confirmDeactivation = async () => {
    if (!selectedProductId) return;
    try {
      await deactivatePromotion(selectedProductId, restaurantId);
      toast({
        title: "Sucesso",
        description: "Promoção desativada com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao desativar promoção",
        variant: "destructive",
      });
    } finally {
      setIsDeactivateDialogOpen(false);
      setSelectedProductId(null);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-6">Carregando produtos...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="active">Promoções Ativas</TabsTrigger>
          <TabsTrigger value="categories">Por Categoria</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activePromotions && activePromotions.length > 0 ? (
              activePromotions.map((product) => (
                <PromotionCard
                  key={product._id}
                  product={{
                    _id: String(product._id),
                    name: product.name,
                    price: product.price,
                    isOnPromotion: product.isOnPromotion,
                    description: product.description || "",
                    image: product.image || "",
                    discountPercentage: product.discountPercentage || 0,
                    promotionalPrice: product.promotionalPrice || 0,
                    promotionStartDate: product.promotionStartDate || "",
                    promotionEndDate: product.promotionEndDate || "",
                  }}
                  onEdit={() => handleEditPromotion(product as Product)}
                  onDeactivate={() =>
                    handleDeactivatePromotion(String(product._id))
                  }
                />
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <Card className="flex h-96 flex-col items-center justify-center">
                  <CardContent className="p-6 text-center">
                    <CircleDollarSign
                      size={48}
                      className="mx-auto mb-4 text-gray-300"
                    />
                    <h3 className="mb-2 text-lg font-medium">
                      Não há produtos em promoção ativos.
                    </h3>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="container mx-auto p-6">
            <div className="space-y-6">
              {categories.map((category) => (
                <CategoryPromotionSection
                  key={category}
                  category={category}
                  products={products.filter((p) => p.category === category)}
                  onApplyPromotion={() => {
                    router.push(
                      `/admin/restaurant/${slug}/promotions/category/${category}`,
                    );
                  }}
                />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={isDeactivateDialogOpen}
        onOpenChange={setIsDeactivateDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar Promoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar esta promoção?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivation}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
