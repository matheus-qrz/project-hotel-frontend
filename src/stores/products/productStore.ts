import { create } from 'zustand';
import { useAuthStore } from '../auth';

// Define product interface based on backend models
export interface Product {
    _id?: string;
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
}

interface ProductState {
    products: Product[];
    loading: boolean;
    error: string | null;

    // Actions
    fetchProducts: (restaurantId: string) => Promise<void>;
    fetchProductById: (id: string) => Promise<Product | undefined>;
    createProduct: (product: Omit<Product, '_id'>, restaurantId: string) => Promise<Product>;
    updateProduct: (id: string, product: Partial<Product>, restaurantId: string) => Promise<Product>;
    deleteProduct: (id: string, restaurantId: string) => Promise<void>;
    fetchPromotionalProducts: (restaurantId: string) => Promise<void>;
    importProducts: (file: File, restaurantId: string) => Promise<{
        success: boolean;
        message: string;
        importedCount?: number;
    }>
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export const useProductStore = create<ProductState>((set, get) => ({
    products: [],
    loading: false,
    error: null,

    fetchProducts: async (restaurantId: string) => {
        set({ loading: true, error: null });

        try {
            const response = await fetch(`${API_URL}/restaurant/${restaurantId}/products/`, {
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

    fetchProductById: async (id: string) => {
        set({ loading: true, error: null });
        const token = useAuthStore.getState().token; // Obtenha o token de autenticação
        try {
            const response = await fetch(`${API_URL} / product / ${id}`, {
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

    createProduct: async (product: Product, restaurantId: string) => {
        set({ loading: true, error: null });
        const token = useAuthStore.getState().token;
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
        const token = useAuthStore.getState().token; // Obtenha o token de autenticação
        try {
            const response = await fetch(`${API_URL} / restaurant / ${restaurantId} / products / ${id} / update`, {
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
        const token = useAuthStore.getState().token; // Obtenha o token de autenticação
        try {
            const response = await fetch(`${API_URL} / restaurant / ${restaurantId} / products / ${id} / delete `, {
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
        const token = useAuthStore.getState().token; // Obtenha o token de autenticação
        try {
            const response = await fetch(`${API_URL} / restaurant / ${restaurantId} / products / promotional`, {
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

    importProducts: async (file: File, restaurantId: string) => {
        set({ loading: true, error: null });
        const token = useAuthStore.getState().token;

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_URL} / restaurant / ${restaurantId} / products /import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Não inclua 'Content-Type' aqui, pois o navegador definirá automaticamente
                    // para multipart/form-data com o boundary correto
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
    }
}));



