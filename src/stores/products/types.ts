// types.ts (ajustado)
export interface Product {
    _id: string;
    name: string;
    price: number;
    description?: string;
    category: string;
    image?: string;
    isAvailable?: boolean;
    quantity: number;
    restaurant: string;
    isOnPromotion: boolean;
    promotionalPrice?: number | null;
    discountPercentage?: number;
    promotionStartDate?: string;
    promotionEndDate?: string;
    ingredients?: string[];
    nutritionalInfo?: string;
    allergens?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProductFormData {
    name: string;
    price: string;
    description: string;
    category: string;
    image: string;
    quantity: number;
    isAvailable: boolean;
    // Novos campos para promoções
    isOnPromotion: boolean;
    promotionalPrice?: string;
    discountPercentage?: string;
    promotionStartDate?: string;
    promotionEndDate?: string;
}

export interface PromotionData {
    discountPercentage: number;
    promotionalPrice: number | null;
    promotionStartDate: string;
    promotionEndDate: string;
    isActive: boolean;
    type: 'PRODUCT' | 'CATEGORY' | 'COMBO';
    categoryId?: string;
    productIds?: string[];
    minPurchaseAmount?: number;
    maxDiscountAmount?: number;
    daysOfWeek?: number[]; // 0-6, onde 0 é domingo
    timeStart?: string; // formato "HH:mm"
    timeEnd?: string; // formato "HH:mm"
    stackable?: boolean; // se pode ser combinada com outras promoções
    description?: string;
    terms?: string;
    createdBy?: string; // ID do usuário que criou
    updatedBy?: string; // ID do último usuário que atualizou
    createdAt?: string;
    updatedAt?: string;
}

// Para tipos específicos de promoção, podemos estender a interface base:
export interface ProductPromotion extends PromotionData {
    type: 'PRODUCT';
    productIds: string[];
}

export interface CategoryPromotion extends PromotionData {
    type: 'CATEGORY';
    categoryId: string;
}

export interface ComboPromotion extends PromotionData {
    type: 'COMBO';
    productIds: string[];
    minQuantity: number;
}

// Para uso com histórico
export interface PromotionHistoryEntry extends PromotionData {
    _id: string;
    previousValues?: Partial<PromotionData>;
    action: 'CREATED' | 'UPDATED' | 'DEACTIVATED' | 'REACTIVATED';
    actionDate: string;
    actionBy: string;
}