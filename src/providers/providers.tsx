'use client';

import { ToastProvider } from '@/components/toast/toastContext';
import { ReactNode } from 'react';

interface ProvidersProps {
    children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    return (
        <html>
            <body>
                <>
                    <ToastProvider>
                        {children}
                    </ToastProvider>
                </>
            </body>
        </html>
    );
}