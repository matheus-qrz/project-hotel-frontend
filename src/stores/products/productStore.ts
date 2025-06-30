import { create } from 'zustand';
import { useAuthStore } from '../auth';
import { PromotionData } from './types';

// Define product interface based on backend models
interface ComboOption {
    name: string; // Nome da opção (ex: tipo de hambúrguer)
    products: string[]; // IDs dos produtos que fazem parte desta opção
}

// Add to Product interface
interface PromotionHistory {
    _id: string;
    discountPercentage: number;
    promotionalPrice: number;
    promotionStartDate: string;
    promotionEndDate: string;
    isActive: boolean;
    createdAt: string;
}

export interface Product {
    _id?: string;
    restaurant: string;
    name: string;
    category: string;
    description: string;
    price: number;
    image: string;
    quantity: number;
    isAvailable: boolean;
    isOnPromotion: boolean;
    discountPercentage: number | null;
    promotionalPrice: number | null;
    promotionStartDate: string | null;
    promotionEndDate: string | null;
    promotionHistory?: PromotionHistory[];
    isCombo?: boolean;
    comboOptions?: ComboOption[];
    isAdditional?: boolean;
    hasAddons?: boolean;
    additionalOptions?: {
        id: string;
        name: string;
        price: number;
        isAvailable: boolean;
    }[];
    hasAccompaniments?: boolean;
    accompaniments?: {
        id: string;
        name: string;
        isAvailable: boolean;
    }[];
    createdAt?: string;
    updatedAt?: string;
}

interface ProductState {
    products: Product[];
    loading: boolean;
    error: string | null;
    selectedProduct: Product | null;
    setSelectedProduct: (product: Product) => void;

    // Actions
    fetchProducts: (restaurantId: string) => Promise<void>;
    fetchProductById: (productId: string, restaurantId: string) => Promise<Product | undefined>;
    createProduct: (product: Omit<Product, '_id'>, restaurantId: string) => Promise<Product>;
    updateProduct: (id: string, product: Partial<Product>, restaurantId: string) => Promise<Product>;
    deleteProduct: (id: string, restaurantId: string) => Promise<void>;
    fetchPromotionalProducts: (restaurantId: string) => Promise<void>;
    applyPromotionToCategory: (categoryId: string, promotionData: PromotionData, restaurantId: string) => Promise<void>;
    getPromotionHistory: (productId: string, restaurantId: string) => Promise<PromotionHistory[]>;
    reactivatePromotion: (productId: string, promotionId: string, restaurantId: string) => Promise<void>;
    deactivatePromotion: (productId: string, restaurantId: string) => Promise<void>;
    editPromotion: (productId: string, promotionData: Partial<PromotionData>, restaurantId: string) => Promise<void>;
    importProducts: (file: File, restaurantId: string) => Promise<{
        success: boolean;
        message: string;
        importedCount?: number;
    }>
    createCombo: (comboData: Omit<Product, '_id'>, restaurantId: string) => Promise<Product>;
    updateCombo: (id: string, comboData: Partial<Product>, restaurantId: string) => Promise<Product>;
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const token = useAuthStore.getState().token;

export const useProductStore = create<ProductState>((set, get) => ({
    products: [],
    loading: false,
    error: null,
    selectedProduct: null,
    setSelectedProduct: (product: Product) => set({ selectedProduct: product }),

    fetchProducts: async (restaurantId: string) => {
        set({ loading: true, error: null });

        try {
            const response = await fetch(`${API_URL}/restaurant/${restaurantId}/products`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar produtos');
            }

            const data = await response.json();
            set({ products: data, loading: false });
        } catch (error) {
            console.error('Error fetching products:', error);
            set({
                error: error instanceof Error ? error.message : 'Erro ao buscar produtos',
                loading: false
            });
        }
    },

    fetchProductById: async (productId: string, restaurantId: string) => {
        set({ loading: true, error: null });
        // Obtenha o token de autenticação
        try {
            const response = await fetch(`${API_URL}/restaurant/${restaurantId}/products/${productId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar produto');
            }

            const data = await response.json();
            set({ loading: false });
            return data;
        } catch (error) {
            console.error('Error fetching product:', error);
            set({
                error: error instanceof Error ? error.message : 'Erro ao buscar produto',
                loading: false
            });
        }
    },

    createProduct: async (product: Omit<Product, '_id'>, restaurantId: string) => {
        set({ loading: true, error: null });

        try {
            const response = await fetch(`${API_URL}/restaurant/${restaurantId}/products`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(product)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao criar produto');
            }

            const data = await response.json();
            const products = get().products;
            set({ products: [...products, data], loading: false });

            return data;
        } catch (error) {
            console.error('Error creating product:', error);
            set({
                error: error instanceof Error ? error.message : 'Erro ao criar produto',
                loading: false
            });
            throw error;
        }
    },

    updateProduct: async (id: string, product: Partial<Product>, restaurantId: string) => {
        set({ loading: true, error: null });
        console.log("token>", token)

        try {
            const response = await fetch(`${API_URL}/restaurant/${restaurantId}/products/${id}/update`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(product)
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar produto');
            }

            const data = await response.json();
            const products = get().products;
            const updatedProducts = products.map(p =>
                p._id === id ? { ...p, ...data } : p
            );

            set({ products: updatedProducts, loading: false });
            return data;
        } catch (error) {
            console.error('Error updating product:', error);
            set({
                error: error instanceof Error ? error.message : 'Erro ao atualizar produto',
                loading: false
            });
            throw error;
        }
    },

    deleteProduct: async (id: string, restaurantId: string) => {
        set({ loading: true, error: null });
        // Obtenha o token de autenticação
        try {
            const response = await fetch(`${API_URL}/restaurant/${restaurantId}/products/${id}/delete`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao excluir produto');
            }

            const products = get().products;
            set({
                products: products.filter(p => p._id !== id),
                loading: false
            });
        } catch (error) {
            console.error('Error deleting product:', error);
            set({
                error: error instanceof Error ? error.message : 'Erro ao excluir produto',
                loading: false
            });
            throw error;
        }
    },

    fetchPromotionalProducts: async (restaurantId: string) => {
        set({ loading: true, error: null });
        // Obtenha o token de autenticação
        try {
            const response = await fetch(`${API_URL}/restaurant/${restaurantId}/products/promotional`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar produtos em promoção');
            }

            const data = await response.json();
            set({ products: data, loading: false });
        } catch (error) {
            console.error('Error fetching promotional products:', error);
            set({
                error: error instanceof Error ? error.message : 'Erro ao buscar produtos em promoção',
                loading: false
            });
        }
    },

    applyPromotionToCategory: async (categoryId, promotionData, restaurantId) => {
        set({ loading: true });

        try {
            const response = await fetch(`${API_URL}/restaurant/${restaurantId}/promotions/category`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    categoryId,
                    ...promotionData,
                }),
            });

            if (!response.ok) throw new Error('Failed to apply category promotion');

            await get().fetchProducts(restaurantId);
            set({ loading: false });
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Erro ao aplicar promoção à categoria', loading: false });
            throw error;
        }
    },

    getPromotionHistory: async (productId, restaurantId) => {

        try {
            const response = await fetch(
                `${API_URL}/restaurant/${restaurantId}/products/${productId}/promotions/history`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) throw new Error('Failed to fetch promotion history');

            return await response.json();
        } catch (error) {
            console.error('Error fetching promotion history:', error);
            return [];
        }
    },

    reactivatePromotion: async (productId, promotionId, restaurantId) => {
        set({ loading: true });

        try {
            const response = await fetch(
                `${API_URL}/restaurant/${restaurantId}/products/${productId}/promotions/${promotionId}/reactivate`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) throw new Error('Failed to reactivate promotion');

            await get().fetchProducts(restaurantId);
            set({ loading: false });
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Erro ao reativar promoção', loading: false });
            throw error;
        }
    },

    importProducts: async (file: File, restaurantId: string) => {
        set({ loading: true, error: null });


        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_URL}/restaurant/${restaurantId}/products/import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao importar produtos');
            }

            const data = await response.json();

            // Atualiza a lista de produtos após a importação bem-sucedida
            await get().fetchProducts(restaurantId);

            set({ loading: false });
            return {
                success: true,
                message: 'Produtos importados com sucesso',
                importedCount: data.importedCount
            };
        } catch (error) {
            console.error('Error importing products:', error);
            set({
                error: error instanceof Error ? error.message : 'Erro ao importar produtos',
                loading: false
            });
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Erro ao importar produtos'
            };
        }
    },

    deactivatePromotion: async (productId: string, restaurantId: string) => {
        set({ loading: true });
        try {
            const response = await fetch(
                `${API_URL}/restaurant/${restaurantId}/products/${productId}/promotion/deactivate`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Falha ao desativar promoção');
            }

            const products = get().products.map(product =>
                product._id === productId
                    ? {
                        ...product,
                        isOnPromotion: false,
                        promotionalPrice: null,
                        discountPercentage: null,
                        promotionStartDate: null,
                        promotionEndDate: null,
                    }
                    : product
            );

            set({ products, loading: false });
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Falha ao desativar promoção', loading: false });
            throw error;
        }
    },

    editPromotion: async (productId: string, promotionData: Partial<PromotionData>, restaurantId: string) => {
        set({ loading: true });
        try {
            const response = await fetch(
                `${API_URL}/restaurant/${restaurantId}/products/${productId}/promotion`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(promotionData),
                }
            );

            if (!response.ok) {
                throw new Error('Falha ao editar promoção');
            }

            const updatedProduct = await response.json();
            const products = get().products.map(product =>
                product._id === productId ? { ...product, ...updatedProduct } : product
            );

            set({ products, loading: false });
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Falha ao editar promoção', loading: false });
            throw error;
        }
    },

    createCombo: async (comboData: Omit<Product, '_id'>, restaurantId: string) => {
        set({ loading: true, error: null });

        try {
            const response = await fetch(`${API_URL}/restaurant/${restaurantId}/combos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(comboData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao criar combo');
            }

            const data = await response.json();
            const products = get().products;
            set({ products: [...products, data], loading: false });

            return data;
        } catch (error) {
            console.error('Error creating combo:', error);
            set({
                error: error instanceof Error ? error.message : 'Erro ao criar combo',
                loading: false
            });
            throw error;
        }
    },

    updateCombo: async (id: string, comboData: Partial<Product>, restaurantId: string) => {
        set({ loading: true, error: null });

        try {
            const response = await fetch(`${API_URL}/restaurant/${restaurantId}/combos/${id}/update`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(comboData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao atualizar combo');
            }

            const data = await response.json();
            const products = get().products;
            const updatedProducts = products.map(p =>
                p._id === id ? { ...p, ...data } : p
            );

            set({ products: updatedProducts, loading: false });
            return data;
        } catch (error) {
            console.error('Error updating combo:', error);
            set({
                error: error instanceof Error ? error.message : 'Erro ao atualizar combo',
                loading: false
            });
            throw error;
        }
    },
}));






