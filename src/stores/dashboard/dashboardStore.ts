// stores/dashboardStore.ts
import { create } from 'zustand';

// Interfaces para cada dashboard
interface DashboardData {
    financial: {
        summary: FinancialSummary;
        revenueReport: ReportData;
        recentSales: SaleItem[];
    };
    orders: {
        summary: OrdersSummary;
        orderReport: ReportData;
        topOrders: SaleItem[];
    };
    customers: {
        summary: CustomersSummary;
        customerReport: ReportData;
        topCustomers: SaleItem[];
    };
    promotions: {
        summary: PromotionsSummary;
        promotionReport: ReportData;
        topPromotions: SaleItem[];
    };
}

interface ReportData {
    monthly: Array<{
        name: string;
        value: number;
    }>;
}

interface SaleItem {
    name: string;
    value: number;
}

interface FinancialSummary {
    revenue: number;
    revenueChange: number;
    totalSales: number;
    salesChange: number;
    averageTicket: number;
    ticketChange: number;
    cmvCmo: number;
    cmvCmoChange: number;
    breakEvenPoint: number;
    operationalProfit: number;
}

interface OrdersSummary {
    inProgress: number;
    inProgressChange: number;
    approved: number;
    approvedChange: number;
    cancelled: number;
    cancelledChange: number;
    avgTicket: number;
    avgTicketChange: number;
    conversionRate: number;
    conversionChange: number;
    avgTime: number;
    avgTimeChange: number;
}

interface CustomersSummary {
    total: number;
    totalChange: number;
    new: number;
    newChange: number;
    retention: number;
    retentionChange: number;
    avgTicket: number;
    avgTicketChange: number;
    frequency: number;
    frequencyChange: number;
    nps: number;
    npsChange: number;
}

interface PromotionsSummary {
    active: number;
    activeChange: number;
    conversionRate: number;
    conversionChange: number;
    avgDiscount: number;
    discountChange: number;
    roi: number;
    roiChange: number;
    cpa: number;
    cpaChange: number;
    revenue: number;
    revenueChange: number;
}

interface DashboardState {
    data: Partial<DashboardData> | null;
    isLoading: boolean;
    error: string | null;
    fetchDashboardData: (unitId: string, type: keyof DashboardData) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
    data: null,
    isLoading: false,
    error: null,

    fetchDashboardData: async (unitId: string, type: keyof DashboardData) => {
        try {
            set({ isLoading: true, error: null });

            // Simulando delay de rede
            await new Promise(resolve => setTimeout(resolve, 1000));

            const currentData = get().data || {};

            set({
                data: {
                    ...currentData,
                    [type]: currentData[type]
                },
                isLoading: false
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Erro desconhecido',
                isLoading: false
            });
        }
    }
}));