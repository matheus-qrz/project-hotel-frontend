'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/components/toast/toastContext';
import SessionManager from '@/hooks/sessionManager';
import { ReactNode } from 'react';

interface ProvidersProps {
    children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    return (
        <SessionProvider>
            <SessionManager>
                {children}
            </SessionManager>
        </SessionProvider>
    );
}