"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { RoleGuard } from "@/hooks/useRoleGuard"

export default function ProductsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <SidebarProvider>
                {children}
            </SidebarProvider>
         </>
    )
}