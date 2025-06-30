'use client';

import './globals.css'
import type { ReactNode } from 'react';
import Providers from '@/providers/providers';

export default function AppLayout({
    children
}: {
    children: ReactNode
}) {

    return (
        <Providers>
            {children}
        </Providers>
    );
}