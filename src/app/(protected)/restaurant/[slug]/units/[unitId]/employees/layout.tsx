// app/admin/layout.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';

export function EmployeesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const loading = status === 'loading';
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER';

    useEffect(() => {
        if (!loading && (!session || !isAdmin)) {
            router.push('/login/admin');
        }
    }, [session, loading, isAdmin, router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!session || !isAdmin) {
        return null; // Não renderiza nada enquanto redireciona
    }

    // Não use <html> aqui, apenas retorne o conteúdo dentro de um div
    return <>
        <SidebarProvider>
            {children}
        </SidebarProvider>
    </>;
}