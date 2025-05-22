// stores/dashboardStore.ts
import { create } from 'zustand';

// Dados mockados para todos os dashboards
const mockData = {
    financial: {
        summary: {
            revenue: 78658.79,
            revenueChange: 15,
            totalSales: 1868,
            salesChange: 8,
            averageTicket: 150.00,
            ticketChange: 2,
            cmvCmo: 65.0,
            cmvCmoChange: -8,
            breakEvenPoint: 69780.15,
            operationalProfit: 27234.19
        },
        revenueReport: {
            monthly: [
                { name: "Jan", value: 45000 },
                { name: "Fev", value: 68000 },
                { name: "Mar", value: 32000 },
                { name: "Abr", value: 55000 },
                { name: "Mai", value: 43000 },
                { name: "Jun", value: 38000 },
                { name: "Jul", value: 28000 },
                { name: "Ago", value: 35000 },
                { name: "Set", value: 42000 },
                { name: "Out", value: 25000 },
                { name: "Nov", value: 48000 },
                { name: "Dez", value: 42000 }
            ]
        },
        recentSales: [
            { name: "Filé à parmegiana", value: 55.00 },
            { name: "Ravioli", value: 55.00 },
            { name: "Fetuccine", value: 55.00 },
            { name: "Barca sushi", value: 55.00 },
            { name: "Barca sushi", value: 55.00 },
            { name: "Filé à parmegiana", value: 55.00 },
            { name: "Combo promocional", value: 55.00 }
        ]
    },
    orders: {
        summary: {
            inProgress: 8,
            inProgressChange: 2,
            approved: 57,
            approvedChange: 5,
            cancelled: 2,
            cancelledChange: -3,
            avgTicket: 157.00,
            avgTicketChange: 8,
            conversionRate: 85,
            conversionChange: 3,
            avgTime: 25,
            avgTimeChange: 2
        },
        orderReport: {
            monthly: [
                { name: "Jan", value: 145 },
                { name: "Fev", value: 168 },
                { name: "Mar", value: 132 },
                { name: "Abr", value: 155 },
                { name: "Mai", value: 143 },
                { name: "Jun", value: 138 },
                { name: "Jul", value: 128 },
                { name: "Ago", value: 135 },
                { name: "Set", value: 142 },
                { name: "Out", value: 125 },
                { name: "Nov", value: 148 },
                { name: "Dez", value: 142 }
            ]
        },
        topOrders: [
            { name: "Filé à parmegiana", value: 250 },
            { name: "Ravioli", value: 200 },
            { name: "Fetuccine", value: 150 },
            { name: "Barca sushi", value: 125 },
            { name: "Combo promocional", value: 100 }
        ]
    },
    customers: {
        summary: {
            total: 1254,
            totalChange: 12,
            new: 85,
            newChange: 5,
            retention: 75,
            retentionChange: 3,
            avgTicket: 157.00,
            avgTicketChange: 8,
            frequency: 2.5,
            frequencyChange: 0.3,
            nps: 4.8,
            npsChange: 0.2
        },
        customerReport: {
            monthly: [
                { name: "Jan", value: 120 },
                { name: "Fev", value: 145 },
                { name: "Mar", value: 95 },
                { name: "Abr", value: 85 },
                { name: "Mai", value: 110 },
                { name: "Jun", value: 130 },
                { name: "Jul", value: 125 },
                { name: "Ago", value: 140 },
                { name: "Set", value: 135 },
                { name: "Out", value: 115 },
                { name: "Nov", value: 125 },
                { name: "Dez", value: 150 }
            ]
        },
        topCustomers: [
            { name: "João Silva", value: 2500 },
            { name: "Maria Santos", value: 2100 },
            { name: "Pedro Oliveira", value: 1850 },
            { name: "Ana Costa", value: 1600 },
            { name: "Carlos Souza", value: 1450 }
        ]
    },
    promotions: {
        summary: {
            active: 8,
            activeChange: 2,
            conversionRate: 25,
            conversionChange: 5,
            avgDiscount: 15,
            discountChange: 2,
            roi: 285,
            roiChange: 15,
            cpa: 12.50,
            cpaChange: -8,
            revenue: 25480,
            revenueChange: 12
        },
        promotionReport: {
            monthly: [
                { name: "Jan", value: 450 },
                { name: "Fev", value: 680 },
                { name: "Mar", value: 320 },
                { name: "Abr", value: 550 },
                { name: "Mai", value: 430 },
                { name: "Jun", value: 380 },
                { name: "Jul", value: 420 },
                { name: "Ago", value: 460 },
                { name: "Set", value: 520 },
                { name: "Out", value: 480 },
                { name: "Nov", value: 580 },
                { name: "Dez", value: 620 }
            ]
        },
        topPromotions: [
            { name: "Combo 1", value: 250 },
            { name: "Promo Aniversário", value: 200 },
            { name: "Dia dos Namorados", value: 150 },
            { name: "Pague 1 Leve 2", value: 125 },
            { name: "Super Sexta", value: 100 }
        ]
    }
};

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

export const useMockedDashboardStore = create<DashboardState>((set, get) => ({
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
                    [type]: mockData[type]
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