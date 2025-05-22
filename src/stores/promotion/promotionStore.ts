// stores/promotionStore.ts
import { create } from 'zustand';

interface Promotion {
    _id: string;
    name: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    conditions?: {
        minOrderValue?: number;
        maxUses?: number;
        applicableProducts?: string[];
    };
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
}

interface PromotionStats {
    active: number;
    cancelled: number;
    monthlyPromotions: {
        monthly: Array<{
            month: string;
            year: number;
            count: number;
        }>;
    };
    totalOrders: {
        count: number;
        change: number;
    };
    topPromotions: Array<{
        name: string;
        orders: number;
    }>;
}

interface PromotionStore {
    promotions: Promotion[];
    stats: PromotionStats | null;
    isLoading: boolean;
    error: string | null;

    // Ações
    fetchPromotions: (unitId: string) => Promise<void>;
    fetchPromotionStats: (unitId: string) => Promise<void>;
    createPromotion: (promotionData: Omit<Promotion, '_id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updatePromotion: (id: string, updates: Partial<Promotion>) => Promise<void>;
    deletePromotion: (id: string) => Promise<void>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const usePromotionStore = create<PromotionStore>((set, get) => ({
    promotions: [],
    stats: null,
    isLoading: false,
    error: null,

    fetchPromotions: async (unitId: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/unit/${unitId}/promotions`);
            if (!response.ok) throw new Error('Erro ao buscar promoções');

            const data = await response.json();
            set({ promotions: data, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchPromotionStats: async (unitId: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/unit/${unitId}/promotions/stats`);
            if (!response.ok) throw new Error('Erro ao buscar estatísticas');

            const data = await response.json();
            set({ stats: data, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    createPromotion: async (promotionData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/promotions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(promotionData)
            });

            if (!response.ok) throw new Error('Erro ao criar promoção');

            const newPromotion = await response.json();
            set(state => ({
                promotions: [...state.promotions, newPromotion],
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    updatePromotion: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/promotions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (!response.ok) throw new Error('Erro ao atualizar promoção');

            const updatedPromotion = await response.json();
            set(state => ({
                promotions: state.promotions.map(p =>
                    p._id === id ? updatedPromotion : p
                ),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    deletePromotion: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/promotions/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Erro ao deletar promoção');

            set(state => ({
                promotions: state.promotions.filter(p => p._id !== id),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    }
}));