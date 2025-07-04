"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import Providers from '@/providers/providers';

export default function ManagersLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <Providers>
            <SidebarProvider>
                {children}
            </SidebarProvider>
        </Providers>
    )
}