"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { RoleGuard } from "@/hooks/useRoleGuard"

export default function RestaurantUnitListLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <RoleGuard allowedRoles={['ADMIN']}>
            <SidebarProvider>
                {children}
            </SidebarProvider>
         </>
    )
}