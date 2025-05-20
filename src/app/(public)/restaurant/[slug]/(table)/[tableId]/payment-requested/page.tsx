'use client';

import React, { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CreditCard, Home, Minus, Plus, Users } from "lucide-react";
import { extractNameFromSlug } from "@/utils/slugify";
import { useCartStore } from "@/stores";
import { formatCurrency } from "@/services/restaurant/services";

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

    const handleSplitCountChange = (newCount: number) => {
        if (newCount < 1) newCount = 1;
        setSplitCount(newCount);
    };

    const total = getTotal();
    const totalPerPerson = splitCount > 1 ? total / splitCount : total;


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


                {/* Campo de divisão de conta */}
                {orderType === 'local' && (
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
                        <h3 className="font-medium text-primary mb-3 flex items-center">
                            <Users size={18} className="mr-2" />
                            Dividir a conta
                        </h3>

                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">Número de pessoas:</span>

                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleSplitCountChange(splitCount - 1)}
                                    disabled={splitCount <= 1}
                                >
                                    <Minus size={14} />
                                </Button>

                                <span className="w-8 text-center font-medium">{splitCount}</span>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleSplitCountChange(splitCount + 1)}
                                >
                                    <Plus size={14} />
                                </Button>
                            </div>
                        </div>

                        {splitCount > 1 && (
                            <div className="mt-2 text-xs text-gray-500">
                                Cada pessoa pagará aproximadamente {formatCurrency(totalPerPerson)}.
                            </div>
                        )}
                    </div>
                )}

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