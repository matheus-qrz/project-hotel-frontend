// app/restaurant/[restaurantId]/products/[productId]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChevronLeft, Edit, Trash2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/services/restaurant/services';
import { extractIdFromSlug } from '@/utils/slugify';

// Interface do produto
interface Product {
    _id: string;
    name: string;
    price: number;
    description?: string;
    category: string;
    image?: string;
    isAvailable: boolean;
    quantity: number;
    restaurant: string;
    createdAt?: string;
    updatedAt?: string;
}

export default function ProductDetailsPage() {
    const { slug, productId } = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();

    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const restaurantId = slug && extractIdFromSlug(String(slug));
    const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

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

    const fetchProductDetails = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Simulação da resposta da API
            // Em produção, substitua por uma chamada real:
            const response = await fetch(`${API_URL}/restaurant/${restaurantId}/products/${productId}`);
            if (!response.ok) throw new Error("Falha ao carregar detalhes do produto");
            const data = await response.json();

            // Simula um pequeno delay
            await new Promise(resolve => setTimeout(resolve, 500));

            if (!response.ok) throw new Error("Produto não encontrado");

            setProduct(data);
        } catch (err) {
            console.error("Erro ao buscar detalhes do produto:", err);
            setError(err instanceof Error ? err.message : "Erro ao carregar detalhes do produto");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteProduct = async () => {
        try {
            // Simulação da exclusão
            // Em produção, substitua por uma chamada real:
            const response = await fetch(`${API_URL}/restaurant/${restaurantId}/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session?.token}`
                }
            });
            if (!response.ok) throw new Error("Falha ao excluir produto");

            // Simula um pequeno delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // Redireciona para a lista de produtos
            router.push(`/restaurant/${restaurantId}/products`);
        } catch (err) {
            alert("Erro ao excluir produto: " + (err instanceof Error ? err.message : String(err)));
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
                    onClick={() => router.push(`/restaurant/${restaurantId}/products`)}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md self-start"
                >
                    Voltar à Lista
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 flex flex-col min-h-screen pb-16">
            {/* Header */}
            <div className="flex items-center mb-6">
                <button
                    onClick={() => router.back()}
                    className="text-gray-600 mr-4"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-bold">Detalhes do Produto</h1>
            </div>

            {/* Product Image */}
            <div className="w-full h-64 bg-gray-100 rounded-lg mb-6 overflow-hidden">
                {product.image ? (
                    <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">Imagem do Produto</span>
                    </div>
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                        Sem imagem
                    </div>
                )}
            </div>

            {/* Product Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold">{product.name}</h2>
                    <p className="text-gray-600">{product.category}</p>
                    <div className="mt-2 flex items-center">
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(product.price)}</p>
                        <span className={`ml-4 px-3 py-1 rounded-full text-xs ${product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {product.isAvailable ? 'Disponível' : 'Indisponível'}
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => router.push(`/restaurant/${restaurantId}/products/${productId}/edit`)}
                        className="p-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                    >
                        <Edit size={20} />
                    </button>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="p-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Product Details */}
            <div className="bg-white rounded-lg border p-6 mb-6">
                <h3 className="text-lg font-semibold mb-3">Descrição</h3>
                <p className="text-gray-700 mb-6">{product.description || 'Sem descrição disponível.'}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Informações do Produto</h3>
                        <dl className="space-y-2">
                            <div className="flex flex-col">
                                <dt className="text-sm text-gray-500">Categoria</dt>
                                <dd>{product.category}</dd>
                            </div>
                            <div className="flex flex-col">
                                <dt className="text-sm text-gray-500">Estoque</dt>
                                <dd>{product.quantity} unidades</dd>
                            </div>
                            <div className="flex flex-col">
                                <dt className="text-sm text-gray-500">Status</dt>
                                <dd className={product.isAvailable ? 'text-green-600' : 'text-red-600'}>
                                    {product.isAvailable ? 'Disponível para venda' : 'Indisponível para venda'}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>

            {/* Product History */}
            <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-3">Histórico</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <dt className="text-sm text-gray-500">Criado em</dt>
                        <dd>{formatDate(product.createdAt)}</dd>
                    </div>
                    <div className="flex flex-col">
                        <dt className="text-sm text-gray-500">Última atualização</dt>
                        <dd>{formatDate(product.updatedAt)}</dd>
                    </div>
                </dl>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Confirmar exclusão</h2>
                        <p className="mb-6">
                            Tem certeza que deseja excluir o produto <strong>{product.name}</strong>?
                            Esta ação não pode ser desfeita.
                        </p>

                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 border rounded-md"
                                type="button"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteProduct}
                                className="px-4 py-2 bg-red-600 text-white rounded-md"
                                type="button"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}