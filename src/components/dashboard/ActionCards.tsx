// components/dashboard/ActionCards.tsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '../ui/card';
import { createActionCards } from './ActionCardsData';
import { Button } from '../ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from "@/lib/utils";
import { ActionCard } from './types';
import { useParams } from 'next/navigation';
import { extractIdFromSlug } from '@/utils/slugify';

export function ActionCards() {
    const { slug } = useParams();
    const [showAll, setShowAll] = useState(false);
    const [sortedCards, setSortedCards] = useState<ActionCard[]>([]);
    const initialCards = 2;

    // Manter apenas um useEffect
    useEffect(() => {
        if (!slug) return;

        const cards = createActionCards(String(slug));

        // Recuperar contagens salvas
        const savedCounts = JSON.parse(localStorage.getItem('actionCardClicks') || '{}');

        // Atualizar cards com contagens
        const updatedCards = cards.map(card => ({
            ...card,
            clickCount: savedCounts[card.id] || 0,
        }));

        // Ordenar por contagem
        const sorted = [...updatedCards].sort((a, b) => b.clickCount - a.clickCount);
        setSortedCards(sorted);
    }, [slug]);

    const handleCardClick = (cardId: string) => {
        const savedCounts = JSON.parse(localStorage.getItem('actionCardClicks') || '{}');
        const newCounts = {
            ...savedCounts,
            [cardId]: (savedCounts[cardId] || 0) + 1
        };
        localStorage.setItem('actionCardClicks', JSON.stringify(newCounts));

        const updated = sortedCards.map(card =>
            card.id === cardId ? { ...card, clickCount: newCounts[cardId] } : card
        ).sort((a, b) => b.clickCount - a.clickCount);

        setSortedCards(updated);
    };

    // Verificar se há cards para renderizar
    if (!sortedCards.length) return null;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cards iniciais sempre visíveis */}
                {sortedCards.slice(0, initialCards).map(card => (
                    <Link
                        key={card.id}
                        href={card.path}
                        onClick={() => handleCardClick(card.id)}
                    >
                        <Card className="hover:shadow-md transition-shadow border border-border bg-transparent">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${card.iconBgColor}`}>
                                        {card.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium mb-1 text-primary">{card.title}</h3>
                                        <p className="text-sm text-gray-500">{card.description}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {/* Cards extras com transição */}
                <div className={cn(
                    "contents",
                    !showAll && "hidden"
                )}>
                    {sortedCards.slice(initialCards).map((card: ActionCard) => (
                        <Link
                            key={card.id}
                            href={card.path}
                            onClick={() => handleCardClick(card.id)}
                            className={cn(
                                "transition-all duration-300",
                                showAll ? "opacity-100 transform translate-y-0" : "opacity-0 transform -translate-y-4"
                            )}
                        >
                            <Card className="hover:shadow-md transition-shadow border border-border bg-transparent">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${card.iconBgColor}`}>
                                            {card.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium mb-1 text-primary">{card.title}</h3>
                                            <p className="text-sm text-gray-500">{card.description}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {sortedCards.length > initialCards && (
                <Button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full h-[34px] inline-flex justify-center items-center text-sm font-medium"
                    variant="outline"
                >
                    {showAll ? (
                        <>
                            Mostrar menos
                            <ChevronUp className="ml-2 h-4 w-4" />
                        </>
                    ) : (
                        <>
                            Ver mais ações
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            )}
        </div>
    );
}