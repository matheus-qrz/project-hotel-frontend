"use client"

import { SidebarProvider } from "@/components/ui/sidebar"


export default function PromotionsManagementLayout({
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