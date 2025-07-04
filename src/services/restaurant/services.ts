// services/restaurant/services.ts

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3333';

// Interface para produtos
export interface IProduct {
    _id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    isAvailable: boolean;
    quantity: number;
}

export interface CartItem {
    productId: string;
    quantity: number;
}

export interface GuestInfo {
    name: string;
}


export async function getRestaurantById(id: string) {
    try {
        // Se não for o ID específico, ainda tentamos a API
        const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3333';
        const response = await fetch(`/api/restaurant/${id}`);

        if (!response.ok) {
            throw new Error(`Restaurante não encontrado (Status: ${response.status})`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar restaurante:', error);
        throw error;
    }
}

export async function getRestaurantBySlug(slug: string) {
    try {
        // Normalize o slug primeiro (remova acentos, converta para minúsculas)
        const normalizedSlug = slug
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();

        console.log("Tentando buscar restaurante com slug:", normalizedSlug);

        // Primeira tentativa: endpoint específico de slug
        const response = await fetch(`/api/restaurant/by-slug/${normalizedSlug}`);

        if (response.ok) {
            const restaurant = await response.json();
            console.log("Restaurante encontrado via endpoint específico:", restaurant);
            return restaurant;
        }

        console.log("Endpoint específico falhou, tentando buscar todos os restaurantes");

        // Segunda tentativa: buscar todos os restaurantes e filtrar
        const allRestaurantsResponse = await fetch(`/api/restaurant`);

        if (allRestaurantsResponse.ok) {
            const restaurants = await allRestaurantsResponse.json();
            console.log(`Buscando entre ${restaurants.length} restaurantes`);

            // Tentar várias formas de correspondência
            const restaurant = restaurants.find((r: any) => {
                // Nome original normalizado (sem acentos e minúsculo)
                const normalizedName = r.name
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .toLowerCase();

                // Nome convertido para slug (espaços para hífens)
                const nameToSlug = normalizedName.replace(/\s+/g, '-');

                console.log(`Comparando: '${normalizedName}' ou '${nameToSlug}' com '${normalizedSlug}'`);

                return (
                    normalizedName === normalizedSlug ||
                    nameToSlug === normalizedSlug ||
                    normalizedName.replace(/\s+/g, '') === normalizedSlug.replace(/-/g, '') // sem espaços/hífens
                );
            });

            if (restaurant) {
                console.log("Restaurante encontrado via filtragem:", restaurant);
                return restaurant;
            }
        }

        console.log("Restaurante não encontrado");
        throw new Error('Restaurante não encontrado');
    } catch (error) {
        console.error('Erro ao buscar restaurante:', error);
        throw error;
    }
}

// Função para buscar produtos de um restaurante
export async function getRestaurantProducts(restaurantId: string) {
    // Dados mock de produtos para o restaurante
    return [
        {
            _id: 'prod1',
            name: 'X-Burger',
            description: 'Hambúrguer com queijo, alface e tomate',
            price: 25.90,
            image: '/xtudo.jpg',
            category: 'Hambúrgueres',
            isAvailable: true
        },
        {
            _id: 'prod2',
            name: 'X-Bacon',
            description: 'Hambúrguer com queijo, bacon, alface e tomate',
            price: 28.90,
            image: '/burger.jpg',
            category: 'Hambúrgueres',
            isAvailable: true
        },
        {
            _id: 'prod3',
            name: 'Batata Frita',
            description: 'Porção de batatas fritas crocantes',
            price: 15.90,
            image: '/batatafrita.jpg',
            category: 'Acompanhamentos',
            isAvailable: true
        },
        {
            _id: 'prod4',
            name: 'Refrigerante Lata',
            description: 'Lata 350ml',
            price: 6.90,
            image: '/cocacola.jpg',
            category: 'Bebidas',
            isAvailable: true
        },
        {
            _id: 'prod5',
            name: 'Suco Natural',
            description: '300ml de suco de fruta natural',
            price: 9.90,
            image: '/suconatural.jpg',
            category: 'Bebidas',
            isAvailable: true
        },
        {
            _id: 'prod6',
            name: 'Pudim',
            description: 'Delicioso pudim de leite condensado',
            price: 12.90,
            image: '/pudim.jpg',
            category: 'Sobremesas',
            isAvailable: true
        }
    ];
}

// Função para extrair categorias dos produtos
export async function getProductCategories(products: IProduct[]) {
    // Extrair categorias únicas dos produtos
    const categoriesSet = new Set<string>();

    products.forEach(product => {
        if (product.category && product.isAvailable) {
            categoriesSet.add(product.category);
        }
    });

    return Array.from(categoriesSet);
}

// Interface para item do carrinho
export interface CartItem {
    productId: string;
    quantity: number;
}

/**
 * Obtém os itens do carrinho
 * @param restaurantName Nome/slug do restaurante
 * @returns Array de itens do carrinho
 */
export function getCartItems(restaurantName: string): CartItem[] {
    const cartKey = `cart-${restaurantName}`;
    return JSON.parse(localStorage.getItem(cartKey) || '[]') as CartItem[];
}


export function saveCartItems(restaurantName: string, items: CartItem[]) {
    if (typeof window === 'undefined') return;

    localStorage.setItem(`cart-${restaurantName}`, JSON.stringify(items));
}

/**
 * Adiciona um produto ao carrinho ou incrementa sua quantidade
 * @param restaurantName Nome/slug do restaurante
 * @param productId ID do produto
 * @param quantity Quantidade a ser adicionada (ou atual, se for incremento)
 * @returns Array atualizado de itens do carrinho
 */
export function addToCart(restaurantName: string, productId: string, quantity: number): CartItem[] {
    const cartKey = `cart-${restaurantName}`;
    const currentCart = JSON.parse(localStorage.getItem(cartKey) || '[]') as CartItem[];

    // Verifica se o produto já está no carrinho
    const existingItemIndex = currentCart.findIndex(item => item.productId === productId);

    // Se produto já existe, atualiza a quantidade
    if (existingItemIndex >= 0) {
        currentCart[existingItemIndex].quantity = quantity;
    } else {
        // Senão, adiciona novo item
        currentCart.push({ productId, quantity });
    }

    // Remove itens com quantidade 0
    const filteredCart = currentCart.filter(item => item.quantity > 0);

    // Salva no localStorage
    localStorage.setItem(cartKey, JSON.stringify(filteredCart));

    return filteredCart;
}

/**
 * Calcula o total do carrinho
 * @param restaurantName Nome/slug do restaurante
 * @param products Lista de produtos disponíveis para referência de preços
 * @returns Valor total do carrinho
 */
export function calculateCartTotal(restaurantName: string, products: IProduct[]): number {
    const cartItems = getCartItems(restaurantName);

    return cartItems.reduce((total, item) => {
        // Encontra o produto correspondente
        const product = products.find(p => p._id === item.productId);

        // Se o produto for encontrado, adiciona o preço multiplicado pela quantidade
        if (product) {
            return total + (product.price * item.quantity);
        }

        // Se não encontrar o produto, retorna o total acumulado sem alteração
        return total;
    }, 0);
}

// Função para buscar um pedido por ID
export async function getOrderById(orderId: string) {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('guest_token');

    try {
        const response = await fetch(`/api/order/${orderId}`, {
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar pedido');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar pedido:', error);
        throw error;
    }
}


/**
 * Formata um valor para exibição como moeda (BRL)
 * @param value Valor a ser formatado
 * @returns String formatada (ex: R$ 10,50)
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

/**
 * Limpa o carrinho completamente
 * @param restaurantName Nome/slug do restaurante
 */
export function clearCart(restaurantName: string): void {
    const cartKey = `cart-${restaurantName}`;
    localStorage.removeItem(cartKey);
}

/**
 * Atualiza a quantidade de um item no carrinho
 * @param restaurantName Nome/slug do restaurante
 * @param productId ID do produto a ser atualizado
 * @param quantity Nova quantidade
 * @returns Array atualizado de itens do carrinho
 */
export function updateCartItem(restaurantName: string, productId: string, quantity: number): CartItem[] {
    const cartKey = `cart-${restaurantName}`;
    const currentCart = JSON.parse(localStorage.getItem(cartKey) || '[]') as CartItem[];

    // Encontra o índice do item
    const itemIndex = currentCart.findIndex(item => item.productId === productId);

    // Se o item existe, atualiza sua quantidade
    if (itemIndex >= 0) {
        currentCart[itemIndex].quantity = quantity;

        // Remove item se quantidade for 0 ou menor
        if (quantity <= 0) {
            currentCart.splice(itemIndex, 1);
        }
    }

    // Salva no localStorage
    localStorage.setItem(cartKey, JSON.stringify(currentCart));

    return currentCart;
}

/**
 * Remove um item do carrinho
 * @param restaurantName Nome/slug do restaurante
 * @param productId ID do produto a ser removido
 * @returns Array atualizado de itens do carrinho
 */
export function removeFromCart(restaurantName: string, productId: string): CartItem[] {
    const cartKey = `cart-${restaurantName}`;
    const currentCart = JSON.parse(localStorage.getItem(cartKey) || '[]') as CartItem[];

    // Filtra o item a ser removido
    const updatedCart = currentCart.filter(item => item.productId !== productId);

    // Salva no localStorage
    localStorage.setItem(cartKey, JSON.stringify(updatedCart));

    return updatedCart;
}

/**
 * Converte uma string de slug para um formato legível
 * @param slug String no formato de slug (ex: "nome-do-restaurante")
 * @returns String formatada com capitalização (ex: "Nome Do Restaurante")
 */
export const slugToName = (slug: string): string => {
    if (!slug) return '';
    return slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Converte um nome para formato de slug
 * @param name Nome a ser convertido
 * @returns String no formato de slug
 */
export const nameToSlug = (name: string): string => {
    if (!name) return '';
    return name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
};