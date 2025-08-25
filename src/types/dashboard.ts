// --- Pedidos ---
export interface OrderSummary {
    total?: number;
    added?: number;
    completed?: number;
    paid?: number;
    cancelled?: number;
    inProgress?: number;
    avgTicket?: number;
    avgTime?: number;
    conversionRate?: number;
}

export interface TopOrder {
    name: string;
    value: number;
}

export interface OrdersDashboardData {
    summary: OrderSummary;
    topOrders: TopOrder[];
    ordersByMonth: {
        month: string;
        value: number
    }[];
}

// --- Financeiro ---
export interface FinancialSummary {
    revenue: number;
    cost: number;
    profit: number;
    discounts: number;
    salesCount?: number;         // total de vendas/pedidos pagos no período
    breakEvenPoint?: number;     // ponto de equilíbrio (R$)
    previousRevenue?: number;    // faturamento do mês anterior (se vier pronto)
    previousCost?: number;       // custo do mês anterior (para variação de CMV/CMO)
}

export interface MonthlyRevenueEntry {
    month: string;
    value: number;
}

export interface RecentSale {
    name: string;
    value: number; // total pago pelo cliente
}

export interface FinancialDashboardData {
    summary: FinancialSummary;
    recentSales: RecentSale[];
    monthlyRevenue?: MonthlyRevenueEntry[];
}

// --- Clientes ---
export interface CustomersSummary {
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

export interface MonthlyCustomerReport {
    month: string; // 'Jan', 'Feb', etc
    count: number; // número de clientes
}

export interface TopCustomer {
    name: string;
    value: number; // valor total pago pelo cliente
}

export interface CustomersDashboardData {
    summary: CustomersSummary;
    customerReport: {
        monthly: MonthlyCustomerReport[];
    };
    topCustomers: TopCustomer[];
}

// --- Promoções ---
export type MonthlyUsagePoint = { month: string; value: number };

export type TopPromotion = {
  id?: string;
  name: string;
  totalSold: number;
};

export interface PromotionsSummary {
  activePromotions: number;
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
  monthlyUsage: MonthlyUsagePoint[];
  topPromotions: TopPromotion[];
}


