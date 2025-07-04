// app/restaurant/[restaurantId]/products/[productId]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChevronLeft, Edit, Trash2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/services/restaurant/services';
import { extractIdFromSlug } from '@/utils/slugify';
import { Card, CardContent } from "@/components/ui/card";
import { MENU_CATEGORIES } from '@/components/products/types';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { useProductStore } from '@/stores';
import { useToast } from '@/hooks/useToast';
import type { Product as StoreProduct } from '@/stores/products/productStore';

// Interface do produto
type Product = StoreProduct;

export default function ProductDetails() {
    const { slug, productId } = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const { toast } = useToast();
    const restaurantId = slug && extractIdFromSlug(String(slug));

    const { deleteProduct, fetchProductById } = useProductStore();

    // Verificação de autenticação
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/login');
        }
    }, [status, router]);

    // Verificação de permissão
    useEffect(() => {
        if (status === "authenticated") {
            if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MANAGER") {
                router.push(`/restaurant/${slug}/menu`);
            }
        }
    }, [session, status, router, restaurantId]);

    // Carregamento de dados do produto
    useEffect(() => {
        if (status === "authenticated" && productId && restaurantId) {
            fetchProductDetails();
        }
    }, [status, productId, restaurantId]);

    const getCategoryName = (categoryId: string) => {
        const category = MENU_CATEGORIES.find(cat => cat.id === categoryId);
        return category ? category.name : 'Sem categoria';
    };

    const fetchProductDetails = async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (!productId || !restaurantId) {
                throw new Error("Dados do produto inválidos");
            }

            const data = await fetchProductById(String(productId), String(restaurantId));

            // Simula um pequeno delay para feedback visual
            await new Promise(resolve => setTimeout(resolve, 500));

            if (!data) {
                throw new Error("Produto não encontrado");
            }

            setProduct(data);
        } catch (err) {
            console.error("Erro ao buscar detalhes do produto:", err);
            setError(err instanceof Error ? err.message : "Erro ao carregar detalhes do produto");
            toast({
                title: "Erro",
                description: "Falha ao carregar detalhes do produto",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteProduct = async () => {
        try {
            if (!productId || !restaurantId) {
                throw new Error("Dados do produto inválidos");
            }

            await deleteProduct(String(productId), String(restaurantId));

            // Simula um pequeno delay para feedback visual
            await new Promise(resolve => setTimeout(resolve, 500));

            toast({
                title: "Sucesso",
                description: "Produto excluído com sucesso",
            });

            router.push(`/admin/restaurant/${restaurantId}/products`);
        } catch (err) {
            console.error("Erro ao excluir produto:", err);
            toast({
                title: "Erro",
                description: "Falha ao excluir produto",
                variant: "destructive",
            });
            setShowDeleteModal(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';

        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="p-4 flex flex-col h-screen">
                <div className="flex items-center mb-6">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-600 mr-4"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">Carregando produto...</h1>
                </div>
                <div className="animate-pulse space-y-4">
                    <div className="h-64 bg-gray-200 rounded w-full"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-32 bg-gray-200 rounded w-full"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 flex flex-col h-screen">
                <div className="flex items-center mb-6">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-600 mr-4"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">Detalhes do Produto</h1>
                </div>
                <div className="bg-red-100 text-red-600 p-4 rounded-md flex items-start">
                    <AlertCircle className="mr-2 mt-1 flex-shrink-0" size={20} />
                    <div>
                        <p className="font-semibold">Erro ao carregar produto</p>
                        <p>{error}</p>
                        <button
                            onClick={fetchProductDetails}
                            className="mt-2 text-red-700 underline"
                        >
                            Tentar novamente
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="p-4 flex flex-col h-screen">
                <div className="flex items-center mb-6">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-600 mr-4"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">Produto não encontrado</h1>
                </div>
                <p className="text-gray-600">
                    O produto solicitado não foi encontrado. Verifique se o ID está correto ou retorne à lista de produtos.
                </p>
                <button
                    onClick={() => router.push(`/admin/restaurant/${restaurantId}/products`)}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md self-start"
                >
                    Voltar à Lista
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 w-[785px]">
            <Card className="w-full bg-white">
                <CardContent className="p-6">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column - Image */}
                            <div className="space-y-4">
                                <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                    {product.image ? (
                                        <div className="relative h-full">
                                            <Image
                                                src={product.image}
                                                alt={product.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-400">
                                            Sem imagem
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column - Product Details */}
                            <div className="space-y-4">
                                {/* Nome do Produto */}
                                <div className="flex flex-row space-y-1.5 justify-between items-center">
                                    <div className='flex flex-col'>
                                        <Label className="text-sm text-gray-500">Nome do produto</Label>
                                        <div className="text-lg font-semibold">{product.name}</div>
                                    </div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                className="text-red-600 border-red-600 hover:bg-red-50"
                                                onClick={() => setShowDeleteModal(true)}
                                            >
                                                <Trash2 size={20} className="items-center justify-center" />
                                            </Button>
                                            <Button
                                                onClick={() => router.push(`/admin/restaurant/${restaurantId}/products/${productId}/edit`)}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Edit size={20} className="items-center justify-center" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Categoria */}
                                <div className="space-y-1.5">
                                    <Label className="text-sm text-gray-500">Categoria</Label>
                                    <div className="font-medium">{getCategoryName(product.category)}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Preço */}
                                    <div className="space-y-1.5">
                                        <Label className="text-sm text-gray-500">Preço</Label>
                                        <div className="text-lg font-bold text-blue-600">
                                            {formatCurrency(product.price)}
                                        </div>
                                    </div>

                                    {/* Quantidade */}
                                    <div className="space-y-1.5">
                                        <Label className="text-sm text-gray-500">Quantidade</Label>
                                        <div className="font-medium">{product.quantity} unidades</div>
                                    </div>
                                </div>

                                {/* Descrição */}
                                <div className="space-y-1.5">
                                    <Label className="text-sm text-gray-500">Descrição</Label>
                                    <div className="text-gray-700 bg-gray-50 rounded-lg p-3 min-h-[100px]">
                                        {product.description || 'Sem descrição disponível.'}
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="flex items-center justify-between space-y-0 rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label>Disponível</Label>
                                        <p className="text-sm text-gray-500">
                                            Produto disponível para venda
                                        </p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-sm ${product.isAvailable
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {product.isAvailable ? 'Disponível' : 'Indisponível'}
                                    </div>
                                </div>

                                {/* Histórico */}
                                <div className="space-y-1.5 pt-4">
                                    <Label className="text-sm text-gray-500">Histórico</Label>
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                        <div>
                                            <p className="text-sm text-gray-500">Criado em</p>
                                            <p className="font-medium">{formatDate(product.createdAt)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Última atualização</p>
                                            <p className="font-medium">{formatDate(product.updatedAt)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Delete Confirmation Modal */}
                    {showDeleteModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <Card className="max-w-md w-full">
                                <CardContent className="p-6">
                                    <h2 className="text-xl font-bold mb-4">Confirmar exclusão</h2>
                                    <p className="mb-6">
                                        Tem certeza que deseja excluir o produto <strong>{product.name}</strong>?
                                        Esta ação não pode ser desfeita.
                                    </p>

                                    <div className="flex justify-end space-x-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowDeleteModal(false)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={handleDeleteProduct}
                                        >
                                            Excluir
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}