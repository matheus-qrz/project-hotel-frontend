"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CreditCard, Home } from "lucide-react";
import { extractNameFromSlug } from "@/utils/slugify";
import { useCartStore } from "@/stores";

export default function PaymentRequestPage() {
  const { slug, tableId } = useParams();
  const [splitCount, setSplitCount] = useState(1);
  const router = useRouter();
  const { getTotal, orderType } = useCartStore();

  // Formatar o nome do restaurante para exibição
  const formattedRestaurantName = slug && extractNameFromSlug(String(slug));

  // Redirecionar para o menu
  const goToMenu = () => {
    router.push(`/restaurant/${slug}/${tableId}/menu`);
  };

  // Voltar para a página inicial
  const goToHomepage = () => {
    router.push("/");
  };

  const total = getTotal();

  return (
    <div className="container mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-4 py-16">
      <div className="text-center">
        <div className="bg-primary/10 mb-6 inline-block rounded-full p-5">
          <CreditCard
            size={40}
            className="text-primary"
          />
        </div>

        <h1 className="mb-3 text-2xl font-bold text-primary">
          Pagamento solicitado
        </h1>

        <p className="mb-2 text-gray-600">
          {tableId
            ? `Um atendente virá até a mesa ${tableId} em breve para processar seu pagamento.`
            : "Um atendente virá em breve para processar seu pagamento."}
        </p>

        <div className="mt-2 text-xs text-gray-500">
          Cada pessoa pagará aproximadamente {total}.
        </div>

        <p className="mb-8 text-sm text-gray-500">
          Agradecemos sua preferência
          {formattedRestaurantName ? ` no ${formattedRestaurantName}` : ""}!
        </p>

        <div className="space-y-3">
          <Button
            onClick={goToMenu}
            variant="outline"
            className="w-full py-6"
          >
            Voltar ao menu
          </Button>

          <Button
            onClick={goToHomepage}
            variant="default"
            className="flex w-full items-center justify-center gap-2 py-6"
          >
            <Home size={18} />
            <span>Página inicial</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
