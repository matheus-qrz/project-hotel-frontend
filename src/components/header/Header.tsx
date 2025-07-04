"use client"

import { Bell, Menu } from "lucide-react";
import { Button } from "../ui/button";
import { useSidebar } from "../ui/sidebar";
import { useRestaurantStore } from "@/stores";
import { useEffect } from "react";
import { extractNameFromSlug } from "@/utils/slugify";
import { useParams, useRouter } from "next/navigation";

export default function Header() {
    const route = useRouter();
    const { toggle, isOpen } = useSidebar();
    const { slug } = useParams();
    const { restaurant, fetchRestaurantData } = useRestaurantStore();

    console.log('Restaurant Slug:', slug);

    // Seu componente
    useEffect(() => {
        const loadRestaurant = async () => {
            try {
                console.log('Tentando carregar restaurante com slug:', slug);
                await fetchRestaurantData(String(slug));
            } catch (error) {
                console.error('Erro ao carregar restaurante:', error);
            }
        };

        loadRestaurant();
    }, [/* suas dependências */]);

    // Use o nome do restaurante do store se disponível, senão use o nome extraído do slug
    const displayName = restaurant?.name || (slug ? extractNameFromSlug(String(slug)) : '');

    return (
        <header className="flex items-center justify-between px-6 py-4 bg-background border-b border-border sticky top-0 z-50 h-16 w-full">
            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={toggle}
                className="h-10 w-10 rounded-full bg-background border-border hover:bg-primary hover:text-secondary"
                aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Sidebar</span>
            </Button>

            <h2 className="text-xl text-primary font-medium text-center cursor-pointer" onClick={() => route.push(`/admin/restaurant/${slug}/dashboard`)}>{displayName}</h2>

            <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full bg-background border-border hover:bg-primary hover:text-secondary"
            >
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
            </Button>
        </header>
    );
}