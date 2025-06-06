'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    Search,
    Plus,
    FileText,
    ArrowUpDown,
    Percent,
    MoreHorizontal,
    Edit,
    Trash,
    Info,
    AlertCircle,
    Loader2,
    RefreshCcw
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/useToast";

// Hooks and stores
import { useProductStore } from '@/stores/products';
import { Product } from '@/stores/products/types';
import { useAuthCheck } from '@/hooks/sessionManager';
import { formatCurrency } from '@/services/restaurant/services';
import { getCategoryName } from '@/utils/getCategoryName';
import { extractIdFromSlug } from '@/utils/slugify';
import { DelayedLoading } from '../loading/DelayedLoading';

interface ProductsListProps {
    slug: string;
}

const CATEGORIES = [
    { id: 'accompaniments', name: 'Acompanhamentos' },
    { id: 'appetizers', name: 'Entradas' },
    { id: 'main', name: 'Pratos Principais' },
    { id: 'desserts', name: 'Sobremesas' },
    { id: 'drinks', name: 'Bebidas' },
    { id: 'sides', name: 'Acompanhamentos' },
    { id: 'specials', name: 'Especiais' },
    { id: 'vegan', name: 'Vegano' },
    { id: 'gluten-free', name: 'Sem Glúten' },
    { id: 'breakfast', name: 'Café da Manhã' },
    { id: 'snacks', name: 'Lanches' },
    { id: 'salads', name: 'Saladas' },
    { id: 'soups', name: 'Sopas' },
    { id: 'pizzas', name: 'Pizzas' },
    { id: 'burgers', name: 'Hambúrgueres' },
    { id: 'pastas', name: 'Massas' },
    { id: 'seafood', name: 'Frutos do Mar' },
    { id: 'grills', name: 'Grelhados' },
    { id: 'international', name: 'Internacional' },
    { id: 'kids', name: 'Menu Infantil' },
    { id: 'healthy', name: 'Saudável' },
    { id: 'snacks2', name: 'Petiscos' },
    { id: 'cocktails', name: 'Coquetéis' },
    { id: 'smoothies', name: 'Smoothies' },
    { id: 'teas', name: 'Chás' },
    { id: 'coffees', name: 'Cafés' },
    { id: 'wines', name: 'Vinhos' },
    { id: 'beers', name: 'Cervejas' },
    { id: 'spirits', name: 'Destilados' },
    { id: 'addOns', name: 'Adicionais' },
];

export default function ProductsList({ slug }: ProductsListProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { isAuthenticated, isLoading: isAuthLoading, isAdminOrManager, session, logout } = useAuthCheck();
    const {
        products,
        error,
        fetchProducts,
        deleteProduct
    } = useProductStore();

    // Estados locais para UI
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [showOnlyPromotions, setShowOnlyPromotions] = useState<boolean>(false);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    const restaurantId = slug && extractIdFromSlug(String(slug));

    // Carregar produtos
    useEffect(() => {
        const loadProducts = async () => {
            if (restaurantId && isAuthenticated && isAdminOrManager) {
                try {
                    await fetchProducts(restaurantId);
                } catch (err) {
                    if (err instanceof Error && err.message.includes('Sessão expirada')) {
                        toast({
                            title: "Sessão expirada",
                            description: "Sua sessão expirou. Por favor, faça login novamente.",
                            variant: "destructive",
                            duration: 5000
                        });
                        await logout()
                        router.push('/login');
                    }
                }
            }
        };

        loadProducts();
    }, [restaurantId, showOnlyPromotions, isAuthenticated, fetchProducts]);

    // Lista de categorias disponíveis
    const categories = ['Todos', ...Array.from(new Set(products.map(product => product.category || 'Sem categoria')))];

    // Filtrar produtos
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
        const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    // Ordenar produtos
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortOrder === 'desc') {
            return a.name.localeCompare(b.name);
        } else {
            return b.name.localeCompare(a.name);
        }
    });

    // Verificar se uma promoção está ativa
    const isPromotionActive = (product: Product) => {
        if (!product.isOnPromotion) return false;
        if (!product.promotionEndDate) return true;

        const now = new Date();
        const endDate = new Date(product.promotionEndDate);
        return now <= endDate;
    };

    // Calcular desconto em porcentagem
    const getDiscountPercentage = (product: Product) => {
        if (!product.isOnPromotion || !product.promotionalPrice) return null;
        const discount = ((product.price - product.promotionalPrice) / product.price) * 100;
        return Math.round(discount);
    };

    // Funções para lidar com exclusão
    const handleDeleteClick = (product: Product) => {
        setCurrentProduct(product);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!currentProduct) return;

        try {
            await deleteProduct(currentProduct._id, restaurantId);
            setShowDeleteDialog(false);
            setCurrentProduct(null);

            toast({
                title: "Produto excluído",
                description: `O produto ${currentProduct.name} foi excluído com sucesso.`,
                duration: 3000
            });
        } catch (err) {
            console.error('Erro ao excluir produto:', err);

            // Show error toast
            toast({
                title: "Erro ao excluir produto",
                description: err instanceof Error ? err.message : "Ocorreu um erro ao excluir o produto",
                variant: "destructive",
                duration: 5000
            });
        }
    };

    // Função para tentar novamente quando houver erro
    const handleRetry = async () => {
        setIsRefreshing(true);
        try {
            await fetchProducts(restaurantId);
            toast({
                title: "Dados atualizados",
                description: "A lista de produtos foi atualizada com sucesso.",
                duration: 3000
            });
        } catch (error) {
            console.error("Erro ao atualizar produtos:", error);
            toast({
                title: "Falha ao atualizar",
                description: "Não foi possível recarregar os produtos. Tente fazer login novamente.",
                variant: "destructive",
                duration: 5000
            });
            await logout();
            router.push('/login');
        } finally {
            setIsRefreshing(false);
        }
    };

    // Renderização condicional para estados de carregamento
    if (isAuthLoading) {
        return (
            <DelayedLoading />
        );
    }

    // Se não estiver autenticado, mostrar mensagem e botão para login
    if (!isAuthenticated) {
        return (
            <Card>
                <CardContent className="pt-6 text-center p-8">
                    <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Sessão expirada</h3>
                    <p className="text-muted-foreground mb-6">
                        Sua sessão expirou ou você não está autenticado. Por favor, faça login novamente.
                    </p>
                    <Button onClick={() => router.push('/login')}>
                        Fazer login
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="w-full space-y-6 p-4">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Buscar produtos..."
                            className={`pl-10 ${products.length === 0 ? 'bg-muted cursor-not-allowed' : ''}`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={products.length === 0}
                        />
                    </div>
                </div>

                <div className="flex max-lg:flex-col gap-2">
                    <div className="flex gap-2 w-full">
                        <Select
                            disabled={products.length === 0}
                            value={selectedCategory}
                            onValueChange={setSelectedCategory}
                        >
                            <SelectTrigger className="w-[180px] shrink-0">
                                <SelectValue placeholder="Categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(category => (
                                    <SelectItem key={category} value={category}>{getCategoryName(category)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="grid grid-cols-3 gap-2 min-w-[140px] sm:max-w-auto flex-1">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                disabled={products.length === 0}
                                title={sortOrder === 'asc' ? 'Ordenar Z-A' : 'Ordenar A-Z'}
                                className="w-full"
                            >
                                <ArrowUpDown className="h-4 w-4" />
                            </Button>

                            <Button
                                variant={showOnlyPromotions ? "secondary" : "outline"}
                                size="icon"
                                onClick={() => setShowOnlyPromotions(!showOnlyPromotions)}
                                disabled={products.length === 0}
                                title={showOnlyPromotions ? 'Ver todos os produtos' : 'Ver apenas produtos em promoção'}
                                className="w-full"
                            >
                                <Percent className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleRetry}
                                disabled={isRefreshing}
                                title="Atualizar produtos"
                                className="w-full"
                            >
                                <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>

                    <div className="flex max-lg:flex-col gap-3">
                        <Button
                            onClick={() => router.push(`/restaurant/${slug}/products/add`)}
                            className="w-full lg:w-auto"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar
                        </Button>

                        <Button
                            variant="secondary"
                            asChild
                            className="w-full lg:w-auto"
                        >
                            <Link href={`/restaurant/${slug}/products/import`}>
                                <FileText className="h-4 w-4 mr-2" />
                                Importar
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mensagem de erro */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro ao carregar produtos</AlertTitle>
                    <AlertDescription>
                        <p>{error}</p>
                        <Button
                            variant="destructive"
                            className="mt-4"
                            onClick={handleRetry}
                            disabled={isRefreshing}
                        >
                            {isRefreshing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Tentando reconectar...
                                </>
                            ) : (
                                "Tentar novamente"
                            )}
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {/* Lista de produtos ou mensagem de vazio */}
            {!error && (
                <>
                    {products.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6 text-center flex flex-col items-center p-8">
                                <div className="bg-muted rounded-full p-3 mb-4">
                                    <AlertCircle className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium mb-2">Nenhum produto cadastrado</h3>
                                <p className="text-muted-foreground mb-6 max-w-md">
                                    Este restaurante ainda não possui produtos cadastrados no cardápio.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {sortedProducts.length === 0 ? (
                                <Card>
                                    <CardContent className="pt-6 text-center p-8">
                                        <p className="mb-4 text-muted-foreground">Nenhum produto encontrado com os filtros atuais.</p>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setSearchTerm('');
                                                setSelectedCategory('Todos');
                                                setShowOnlyPromotions(false);
                                            }}
                                        >
                                            Limpar filtros
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-6">
                                    {/* Agrupar produtos por categoria */}
                                    {selectedCategory === 'Todos' ? (
                                        Object.entries(
                                            sortedProducts.reduce((acc, product) => {
                                                const category = product.category || 'Sem categoria';
                                                if (!acc[category]) {
                                                    acc[category] = [];
                                                }
                                                acc[category].push(product as Product);
                                                return acc;
                                            }, {} as Record<string, Product[]>)
                                        ).map(([category, categoryProducts]) => (
                                            <div key={category} className="w-full mb-6">
                                                <div className="flex items-center mb-3">
                                                    <h2 className="text-lg font-medium text-foreground">{getCategoryName(category || '')}</h2>
                                                    <Separator className="ml-4 flex-1" />
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {categoryProducts.map(product => (
                                                        <ProductCard
                                                            key={product._id}
                                                            product={product}
                                                            restaurantId={restaurantId}
                                                            formatCurrency={formatCurrency}
                                                            isPromotionActive={isPromotionActive}
                                                            getDiscountPercentage={getDiscountPercentage}
                                                            onEditClick={() => router.push(`/restaurant/${restaurantId}/products/${product._id}/edit`)}
                                                            onPromotionClick={() => router.push(`/restaurant/${restaurantId}/products/${product._id}/promotion`)}
                                                            onDeleteClick={() => handleDeleteClick(product)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="space-y-3">
                                            {sortedProducts.map(product => (
                                                <ProductCard
                                                    key={product._id}
                                                    product={product as Product}
                                                    restaurantId={restaurantId}
                                                    formatCurrency={formatCurrency}
                                                    isPromotionActive={isPromotionActive}
                                                    getDiscountPercentage={getDiscountPercentage}
                                                    onEditClick={() => router.push(`/restaurant/${restaurantId}/products/${product._id}/edit`)}
                                                    onPromotionClick={() => router.push(`/restaurant/${restaurantId}/products/${product._id}/promotion`)}
                                                    onDeleteClick={() => handleDeleteClick(product as Product)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* Dialog de confirmação de exclusão */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar exclusão</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir o produto <strong>{currentProduct?.name}</strong>?
                            Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>
                            Excluir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Componente de card de produto
interface ProductCardProps {
    product: Product;
    restaurantId: string;
    formatCurrency: (value: number) => string;
    isPromotionActive: (product: Product) => boolean;
    getDiscountPercentage: (product: Product) => number | null;
    onEditClick: () => void;
    onPromotionClick: () => void;
    onDeleteClick: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
    product,
    restaurantId,
    formatCurrency,
    isPromotionActive,
    getDiscountPercentage,
    onEditClick,
    onPromotionClick,
    onDeleteClick
}) => {
    const getCategoryName = (categoryId: string) => {
        const category = CATEGORIES.find(cat => cat.id === categoryId);
        return category ? category.name : 'Sem categoria';
    };
    const promotionActive = isPromotionActive(product);
    const discountPercentage = getDiscountPercentage(product);

    return (
        <Card className={`w-full min-h-36 relative ${product.isOnPromotion && promotionActive ? 'border-rose-200 bg-rose-50' : ''}`}>
            <CardContent className="p-4">
                <div className="flex gap-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-md flex-shrink-0 bg-muted">
                        {product.image ? (
                            <div className="h-full w-full relative">
                                <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    sizes="64px"
                                    className="object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = '/placeholder-image.png';
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                                Sem imagem
                            </div>
                        )}

                        {product.isOnPromotion && promotionActive && discountPercentage && (
                            <div className="absolute top-0 right-0 bg-rose-500 text-white text-xs font-bold px-1 py-0.5 rounded-bl">
                                -{discountPercentage}%
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col flex-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-medium">{product.name}</h3>
                                <p className="text-muted-foreground text-sm">{getCategoryName(product.category)}</p>

                                {product.isOnPromotion && promotionActive && product.promotionalPrice ? (
                                    <div className="mt-1">
                                        <span className="text-muted-foreground line-through text-sm mr-2">
                                            {formatCurrency(product.price)}
                                        </span>
                                        <span className="text-rose-600 font-medium">
                                            {formatCurrency(product.promotionalPrice)}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-primary font-medium mt-1 block">
                                        {formatCurrency(product.price)}
                                    </span>
                                )}
                            </div>

                            {/* Dropdown para telas maiores */}
                            <div className="lg:block hidden">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Abrir menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" side="bottom" className="w-48">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/restaurant/${restaurantId}/products/${product._id}/details`}>
                                                <Info className="h-4 w-4 mr-2" />
                                                Ver detalhes
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={onEditClick}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Editar produto
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={onPromotionClick}>
                                            <Percent className="h-4 w-4 mr-2" />
                                            {product.isOnPromotion ? 'Gerenciar promoção' : 'Adicionar promoção'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={onDeleteClick}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash className="h-4 w-4 mr-2" />
                                            Excluir produto
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Botões verticais para telas menores */}
                            <div className="hidden max-lg:flex flex-col absolute top-2 right-4 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={onEditClick}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={onPromotionClick}
                                >
                                    <Percent className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 text-destructive hover:text-destructive"
                                    onClick={onDeleteClick}
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Badges reposicionadas */}
                        <div className="flex gap-2 mt-4 lg:static absolute bottom-4 left-4">
                            <Badge variant={product.isAvailable ? "success" : "destructive"}>
                                {product.isAvailable ? 'Disponível' : 'Indisponível'}
                            </Badge>

                            {product.isOnPromotion && promotionActive && (
                                <Badge variant="secondary" className="bg-rose-100 text-rose-800 hover:bg-rose-200">
                                    Promoção
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};