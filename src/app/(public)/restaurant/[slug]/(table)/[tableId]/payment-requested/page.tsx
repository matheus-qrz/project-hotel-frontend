'use client';

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CreditCard, Home } from "lucide-react";
import { extractNameFromSlug } from "@/utils/slugify";
import { useCartStore } from "@/stores";

export default function PaymentPage() {
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
        router.push('/');
    };

    const total = getTotal();

    return (
        <div className="container mx-auto px-4 py-16 max-w-md flex flex-col items-center justify-center min-h-[80vh]">
            <div className="text-center">
                <div className="inline-block p-5 bg-primary/10 rounded-full mb-6">
                    <CreditCard size={40} className="text-primary" />
                </div>

                <h1 className="text-2xl font-bold text-primary mb-3">
                    Pagamento solicitado
                </h1>

                <p className="text-gray-600 mb-2">
                    {tableId ? `Um atendente virá até a mesa ${tableId} em breve para processar seu pagamento.` : 'Um atendente virá em breve para processar seu pagamento.'}
                </p>

                <div className="mt-2 text-xs text-gray-500">
                    Cada pessoa pagará aproximadamente {total}.
                </div>

                <p className="text-gray-500 mb-8 text-sm">
                    Agradecemos sua preferência{formattedRestaurantName ? ` no ${formattedRestaurantName}` : ''}!
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
                        className="w-full py-6 flex items-center justify-center gap-2"
                    >
                        <Home size={18} />
                        <span>Página inicial</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}