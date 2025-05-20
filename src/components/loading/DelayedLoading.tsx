import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const DelayedComponent = dynamic(
    () => import('@/components/loading/LoadingComponent').then(mod => mod.LoadingComponent),
    { loading: () => <p>Loading...</p> }
);

export function DelayedLoading() {
    return (
        <Suspense>
            <DelayedComponent />
        </Suspense>
    );
}