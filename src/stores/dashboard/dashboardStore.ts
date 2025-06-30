// stores/dashboardStore.ts
import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from '@/stores';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interfaces para métricas
interface FinancialMetrics {
    revenue: number;
    totalSales: number;
    averageTicket: number;
    cmpCmo: number;
    breakEvenPoint: number;
    operationalProfit: number;
    monthlyRevenue: Array<{
        month: string;
        year: number;
        value: number;
    }>;
    recentSales: Array<{
        items: Array<{
            name: string;
            quantity: number;
            price: number;
        }>;
        total: number;
        date: string;
    }>;
}

interface OrderMetrics {
    inProgress: number;
    approved: number;
    cancelled: number;
    averageTicket: number;
    conversionRate: number;
    averageTime: number;
    ordersByMonth: Array<{
        month: string;
        year: number;
        value: number;
    }>;
    topProducts: Array<{
        name: string;
        orderCount: number;
        revenue: number;
    }>;
}

interface PromotionMetrics {
    activeCount: number;
    conversionRate: number;
    averageDiscount: number;
    averageROI: number;
    acquisitionCost: number;
    promotionalRevenue: number;
    promotionUsage: Array<{
        month: string;
        year: number;
        value: number;
    }>;
    popularPromotions: Array<{
        name: string;
        uses: number;
        revenue: number;
    }>;
}

interface CustomerMetrics {
    totalCustomers: number;
    newCustomers: number;
    retentionRate: number;
    averageTicket: number;
    frequency: number;
    nps: number;
    newCustomersByMonth: Array<{
        month: string;
        year: number;
        value: number;
    }>;
    topCustomers: Array<{
        name: string;
        totalSpent: number;
    }>;
}

interface DashboardState {
    financial: FinancialMetrics;
    orders: OrderMetrics;
    promotions: PromotionMetrics;
    customers: CustomerMetrics;
    isLoading: boolean;
    error: string | null;
    fetchFinancialData: (unitId: string) => Promise<void>;
    fetchOrdersData: (unitId: string) => Promise<void>;
    fetchPromotionsData: (unitId: string) => Promise<void>;
    fetchCustomersData: (unitId: string) => Promise<void>;
    fetchAllDashboardData: (unitId: string) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    financial: {
        revenue: 0,
        totalSales: 0,
        averageTicket: 0,
        cmpCmo: 0,
        breakEvenPoint: 0,
        operationalProfit: 0,
        monthlyRevenue: [],
        recentSales: []
    },
    orders: {
        inProgress: 0,
        approved: 0,
        cancelled: 0,
        averageTicket: 0,
        conversionRate: 0,
        averageTime: 0,
        ordersByMonth: [],
        topProducts: []
    },
    promotions: {
        activeCount: 0,
        conversionRate: 0,
        averageDiscount: 0,
        averageROI: 0,
        acquisitionCost: 0,
        promotionalRevenue: 0,
        promotionUsage: [],
        popularPromotions: []
    },
    customers: {
        totalCustomers: 0,
        newCustomers: 0,
        retentionRate: 0,
        averageTicket: 0,
        frequency: 0,
        nps: 0,
        newCustomersByMonth: [],
        topCustomers: []
    },
    isLoading: false,
    error: null,

    fetchFinancialData: async (unitId: string) => {
        try {
            set({ isLoading: true, error: null });
            const response = await api.get(`/${unitId}/financial`);

            // Validação e tratamento dos dados
            const financialData = response.data;
            if (financialData) {
                financialData.revenue = Math.max(0, Number(financialData.revenue) || 0);
                financialData.totalSales = Math.max(0, Number(financialData.totalSales) || 0);
                financialData.averageTicket = financialData.totalSales > 0 ?
                    financialData.revenue / financialData.totalSales : 0;
            }

            set((state) => ({
                ...state,
                financial: financialData,
                isLoading: false
            }));
        } catch (error) {
            set((state) => ({
                ...state,
                error: error instanceof Error ? error.message : 'Erro ao carregar dados financeiros',
                isLoading: false
            }));
        }
    },

    fetchOrdersData: async (unitId: string) => {
        try {
            set({ isLoading: true, error: null });
            const response = await api.get(`/${unitId}/orders`);
            set((state) => ({
                ...state,
                orders: response.data,
                isLoading: false
            }));
        } catch (error) {
            set((state) => ({
                ...state,
                error: error instanceof Error ? error.message : 'Erro ao carregar dados de pedidos',
                isLoading: false
            }));
        }
    },

    fetchPromotionsData: async (unitId: string) => {
        try {
            set({ isLoading: true, error: null });
            const response = await api.get(`/${unitId}/promotions`);
            set((state) => ({
                ...state,
                promotions: response.data,
                isLoading: false
            }));
        } catch (error) {
            set((state) => ({
                ...state,
                error: error instanceof Error ? error.message : 'Erro ao carregar dados de promoções',
                isLoading: false
            }));
        }
    },

    fetchCustomersData: async (unitId: string) => {
        try {
            set({ isLoading: true, error: null });
            const response = await api.get(`/${unitId}/customers`);
            set((state) => ({
                ...state,
                customers: response.data,
                isLoading: false
            }));
        } catch (error) {
            set((state) => ({
                ...state,
                error: error instanceof Error ? error.message : 'Erro ao carregar dados de clientes',
                isLoading: false
            }));
        }
    },

    fetchAllDashboardData: async (unitId: string) => {
        try {
            set({ isLoading: true, error: null });

            const [financialRes, ordersRes, promotionsRes, customersRes] = await Promise.all([
                api.get(`/${unitId}/financial`),
                api.get(`/${unitId}/orders`),
                api.get(`/${unitId}/promotions`),
                api.get(`/${unitId}/customers`)
            ]);

            set((state) => ({
                ...state,
                financial: financialRes.data,
                orders: ordersRes.data,
                promotions: promotionsRes.data,
                customers: customersRes.data,
                isLoading: false,
                error: null
            }));
        } catch (error) {
            set((state) => ({
                ...state,
                error: error instanceof Error ? error.message : 'Erro ao carregar dados do dashboard',
                isLoading: false
            }));
        }
    }
})); 