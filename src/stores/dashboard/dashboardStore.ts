import { CustomersDashboardData, FinancialDashboardData, OrdersDashboardData, PromotionsSummary } from '@/types/dashboard';
import { create } from 'zustand';

interface DashboardState {
    data: {
        orders: OrdersDashboardData,
        financial?: FinancialDashboardData;
        customers?: CustomersDashboardData;
        promotions?: PromotionsSummary;
    };
    isLoading: boolean;
    error: string | null;
    fetchDashboardData: (
        scope: 'unit' | 'restaurant',
        id: string,
        type: 'orders' | 'financial' | 'customers' | 'promotions'
    ) => Promise<void>;
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export const useDashboardStore = create<DashboardState>((set) => ({
    data: {
        orders: {
            summary: { total: 0, completed: 0, paid: 0, cancelled: 0, added: 0 },
            topOrders: [],
            ordersByMonth: [],
        }
    },
    isLoading: false,
    error: null,

    fetchDashboardData: async (scope, id, type) => {
    try {
        const res = await fetch(`${API_URL}/dashboard/${scope}/${id}/${type}`);
        const result = await res.json();

        set((state) => ({
        data: {
            ...state.data,
            [type]: result, 
        },
        isLoading: false,
        error: null,
        }));
    } catch (error: any) {
        console.error("Erro ao buscar dashboard:", error);
        set(() => ({
        isLoading: false,
        error: "Erro ao buscar dados do dashboard",
        }));
    }
    }

}));
