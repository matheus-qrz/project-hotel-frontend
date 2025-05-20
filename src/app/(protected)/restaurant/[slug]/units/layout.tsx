"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import Providers from "@/providers/providers"

export default function RestaurantUnitListLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider>
            {children}
        </SidebarProvider>
    )
}