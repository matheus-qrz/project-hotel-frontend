import { Loader2 } from "lucide-react";

export function LoadingComponent() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
            <span className="text-sm text-gray-600 font-medium">Carregando...</span>
        </div>
    );
}

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';

const DelayedComponent = dynamic(
    () => import('@/components/loading/LoadingComponent').then(mod => mod.LoadingComponent),
    {
        loading: () => (
            <div className="container mx-auto px-4 py-6 w-[785px]">
                <Card className="w-full bg-white">
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center justify-center h-[400px]">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                            <span className="text-sm text-gray-600 font-medium">Carregando...</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }
);

export function DelayedLoading() {
    return (
        <Suspense fallback={
            <div className="container mx-auto px-4 py-6 w-[785px]">
                <Card className="w-full bg-white">
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center justify-center h-[400px]">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                            <span className="text-sm text-gray-600 font-medium">Carregando...</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        }>
            <DelayedComponent />
        </Suspense>
    );
}