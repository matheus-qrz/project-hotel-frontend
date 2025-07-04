'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, Save, X, Loader2 } from 'lucide-react';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { useProductStore } from '@/stores/products';
import { extractIdFromSlug } from '@/utils/slugify';
import { formatCurrency } from '@/services/restaurant/services';
import type { Product as StoreProduct } from '@/stores/products/productStore';
import { useSession } from 'next-auth/react';

type Product = StoreProduct;

const formSchema = z.object({
    discountPercentage: z.string().min(1, { message: 'Percentual de desconto é obrigatório' })
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 100, {
            message: 'Percentual de desconto deve ser entre 0 e 100',
        }),
    promotionStartDate: z.string().min(1, { message: 'Data de início é obrigatória' })
        .refine((val) => !isNaN(Date.parse(val)), {
            message: 'Data de início inválida',
        }),
    promotionEndDate: z.string().min(1, { message: 'Data de término é obrigatória' })
        .refine((val) => !isNaN(Date.parse(val)), {
            message: 'Data de término inválida',
        }),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreatePromotion() {
    const router = useRouter();
    const { slug, productId } = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const { data: session, status } = useSession();
    const { selectedProduct, fetchProductById, updateProduct } = useProductStore();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    console.log('slug:', slug);
    console.log('productId:', productId);

    const restaurantId = slug && extractIdFromSlug(String(slug));

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            discountPercentage: '',
            promotionStartDate: '',
            promotionEndDate: '',
        },
    });

    useEffect(() => {
        if (status === "authenticated") {
            if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MANAGER") {
                router.push(`/admin/restaurant/${slug}/menu`);
            }
        }
    }, [session, status, router, restaurantId]);

    useEffect(() => {
        if (status === "authenticated" && productId && restaurantId) {
            fetchProductDetails();
        }
    }, [status, productId, restaurantId]);

    const fetchProductDetails = async () => {
        setLoading(true);
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
            setLoading(false);
        }
    };

    const calculatePromotionalPrice = (price: number, discount: number) => {
        return price - (price * (discount / 100));
    };

    const onSubmit = async (values: FormValues) => {
        let selectedProduct = product;
        console.log('Form values:', values);
        console.log('Selected product:', selectedProduct);
        console.log('Fui disparado');

        if (!selectedProduct || !productId || !restaurantId) return;

        setLoading(true);
        try {
            const updatedData = {
                isOnPromotion: true,
                discountPercentage: Number(values.discountPercentage),
                promotionalPrice: calculatePromotionalPrice(
                    selectedProduct.price,
                    Number(values.discountPercentage)
                ),
                promotionStartDate: values.promotionStartDate,
                promotionEndDate: values.promotionEndDate,
            };

            await updateProduct(String(productId), updatedData, restaurantId);

            toast({
                title: 'Sucesso',
                description: 'Promoção aplicada com sucesso.'
            });

            router.push(`/admin/restaurant/${slug}/products`);
        } catch (error) {
            console.error('Erro ao aplicar promoção:', error);
            toast({
                title: 'Erro',
                variant: 'destructive',
                description: 'Erro ao aplicar promoção.'
            });
        } finally {
            setLoading(false);
        }
    };

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
                    onClick={() => router.push(`/admin/restaurant/${slug}/products`)}
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
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center">
                                    <h1 className="text-xl font-bold">Aplicar Promoção</h1>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {loading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save size={20} className="mr-2" />
                                        )}
                                        Aplicar Promoção
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.back()}
                                    >
                                        <X size={20} className="mr-2" />
                                        Cancelar
                                    </Button>
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <h2 className="font-semibold text-lg mb-2">{product.name}</h2>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Preço atual:</span>
                                    <span className="font-bold text-lg">
                                        {formatCurrency(product.price)}
                                    </span>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="discountPercentage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Percentual de desconto (%)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="100"
                                                    placeholder="10"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Preview do preço com desconto */}
                                <div className="bg-blue-50 rounded-lg p-4 flex flex-col justify-center">
                                    <span className="text-sm text-blue-600">Preço promocional:</span>
                                    <span className="text-xl font-bold text-blue-700">
                                        {formatCurrency(
                                            calculatePromotionalPrice(
                                                product.price,
                                                Number(form.watch('discountPercentage') || 0)
                                            )
                                        )}
                                    </span>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="promotionStartDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data de início</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="promotionEndDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data de término</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}