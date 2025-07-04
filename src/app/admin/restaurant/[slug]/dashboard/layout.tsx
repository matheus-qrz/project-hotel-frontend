// app/admin/layout.tsx
'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import Providers from '@/providers/providers';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Providers>
            <SidebarProvider>
                {children}
            </SidebarProvider>
        </Providers>
    );
}