// app/admin/layout.tsx
'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import Providers from '@/providers/providers';

export default function QRCodeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            {children}
        </SidebarProvider>
    );
}