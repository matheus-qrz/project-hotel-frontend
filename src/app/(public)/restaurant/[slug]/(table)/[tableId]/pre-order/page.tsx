'use client';

import { useProductStore } from '@/stores/products';
import { DelayedLoading } from '@/components/loading/DelayedLoading';
import PreOrderScreen from '@/components/order/PreOrder';

export default function PreOrderPage() {
    const { loading } = useProductStore();

    if (loading) {
        return <DelayedLoading />;
    }

    return (
        <PreOrderScreen />
    );
}