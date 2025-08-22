"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { extractIdFromSlug } from "@/utils/slugify";
import { CartClient } from "@/components/cart/CartClient";
import { useProductStore } from "@/stores/products";

export default function CartPage() {
  const { slug } = useParams();
  const { fetchProducts } = useProductStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const restaurantId = slug && extractIdFromSlug(String(slug));

  useEffect(() => {
    const fetchRestaurantProducts = async () => {
      try {
        setIsLoading(true);
        await fetchProducts(String(restaurantId));
      } catch (err: any) {
        console.error("Erro ao buscar produtos:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (restaurantId) {
      fetchRestaurantProducts();
    }
  }, [restaurantId]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-md px-4 py-8">
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-1/4 rounded bg-gray-200"></div>
          <div className="mb-8 h-4 w-1/2 rounded bg-gray-200"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded bg-gray-200"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-md px-4 py-8 text-center">
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <h2 className="mb-2 text-lg font-bold">Erro</h2>
          <p>
            Não foi possível carregar os produtos. Por favor, tente novamente
            mais tarde.
          </p>
        </div>
      </div>
    );
  }

  return <CartClient />;
}
