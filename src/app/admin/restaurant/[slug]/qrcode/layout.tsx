// app/admin/layout.tsx
'use client';

import { SidebarProvider } from '@/components/ui/sidebar';


export default function QRCodeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <SidebarProvider>
                {children}
            </SidebarProvider>
         </>
    );
}