import { CustomersDashboardData, FinancialDashboardData, OrdersDashboardData, PromotionsDashboardData } from '@/types/dashboard';
import { create } from 'zustand';

interface DashboardState {
    data: {
        orders: OrdersDashboardData,
        financial?: FinancialDashboardData;
        customers?: CustomersDashboardData;
        promotions?: PromotionsDashboardData;
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
        set({ isLoading: true, error: null });

        try {
            const response = await fetch(
                `${API_URL}/dashboard/${scope}/${id}/${type}`
            );
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao buscar dados do dashboard');
            }

            set((state) => ({
                data: {
                    ...state.data,
                    [type]: data
                },
                isLoading: false
            }));
        } catch (error: any) {
            console.error("Erro no fetchDashboardData:", error);
            set({ isLoading: false, error: error.message });
        }
    }
}));
