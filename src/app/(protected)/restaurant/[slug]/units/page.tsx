"use client";

import { useEffect, useState } from "react";
import UnitsList from "@/components/units/UnitsList";
import { Sidebar } from "@/components/dashboard/SideMenu";
import Header from "@/components/header/Header";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useRestaurantId } from "@/hooks/useRestaurantId";
import { useAuthStore, useRestaurantUnitStore } from '@/stores';
import { useParams, useRouter } from "next/navigation";
import { useAuthCheck } from "@/hooks/sessionManager";
import { extractIdFromSlug } from "@/utils/slugify";
import { useToast } from "@/hooks/useToast";
import { DelayedLoading } from "@/components/loading/DelayedLoading";

export default function UnitsPage() {
    const router = useRouter();
    const toast = useToast();
    const { isAuthenticated, isLoading, isAdminOrManager } = useAuthCheck();
    const { units = [], fetchUnits } = useRestaurantUnitStore()
    const { slug } = useParams();
    const { isOpen } = useSidebar();
    const token = useAuthStore((state) => state.token);

    const restaurantId = slug && extractIdFromSlug(String(slug));

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || !isAdminOrManager)) {
            console.log('Redirecionando: Não autenticado ou sem permissão');
            router.push('/login');
            return;
        }
    }, [isAuthenticated, isAdminOrManager, isLoading, router]);

    useEffect(() => {
        const loadUnits = async () => {
            if (!restaurantId || !token || !isAuthenticated) {
                return;
            }

            try {
                await fetchUnits(restaurantId);
            } catch (err) {
                console.error("Erro ao buscar unidades:", err);
                toast.toast({
                    variant: "destructive",
                    title: "Acesso negado",
                    description: "Você precisa estar logado como administrador para criar unidades."
                });
            }
        };

        loadUnits();
    }, [restaurantId, token, isAuthenticated, fetchUnits]);

    if (isLoading) {
        return (
            <DelayedLoading />
        );
    }

    return (
        <div className="flex flex-col static h-screen bg-background w-dvw">
            <Header />
            <div className={cn("flex flex-col w-full transition-all duration-300", isOpen ? "ml-64" : "ml-0")}>
                <Sidebar />
                <div className="flex-1 w-full overflow-auto">
                    <div className="max-w-5xl mx-auto px-6 py-4">
                        <UnitsList
                            units={units}
                            isLoading={isLoading}
                            restaurantId={String(restaurantId)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
