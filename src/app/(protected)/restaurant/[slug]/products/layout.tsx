"use client"

import { SidebarProvider } from "@/components/ui/sidebar"

export default function ProductsLayout({
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