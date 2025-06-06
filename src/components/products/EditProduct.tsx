'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Save, X, Loader2 } from 'lucide-react';
import { extractIdFromSlug } from '@/utils/slugify';
import { Card, CardContent } from "@/components/ui/card";
import { MENU_CATEGORIES } from '@/components/products/types';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/useToast';
import { useProductStore } from '@/stores';

const formSchema = z.object({
    name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
    category: z.string().min(1, { message: 'Selecione uma categoria' }),
    price: z.string().refine((val) => {
        const numericString = val.replace(/[^\d.,]/g, '').replace(',', '.');
        const number = parseFloat(numericString);
        return !isNaN(number) && number > 0;
    }, {
        message: 'Preço deve ser um número positivo',
    }),
    description: z.string().optional(),
    quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: 'Quantidade deve ser um número positivo',
    }),
    image: z.string().optional(),
    isAvailable: z.boolean().default(true),
});

export default function ProductEdit() {
    const { slug, productId } = useParams();
    const router = useRouter();
    const { status } = useSession();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [originalImage, setOriginalImage] = useState<string>('');
    const { fetchProductById, updateProduct } = useProductStore();

    const restaurantId = slug && extractIdFromSlug(String(slug));

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            category: '',
            price: '',
            description: '',
            quantity: '0',
            image: '',
            isAvailable: true,
        }
    });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (productId && restaurantId) {
            fetchProductDetails();
        }
    }, [productId, restaurantId]);

    const fetchProductDetails = async () => {
        try {
            if (!productId || !restaurantId) {
                throw new Error("Dados do produto inválidos");
            }

            const data = await fetchProductById(String(productId), String(restaurantId));
            if (!data) {
                throw new Error("Produto não encontrado");
            }

            setOriginalImage(data.image || '');
            form.reset({
                name: data.name,
                category: data.category,
                price: data.price.toString(),
                description: data.description || '',
                quantity: data.quantity.toString(),
                image: data.image || '',
                isAvailable: data.isAvailable,
            });
        } catch (error) {
            console.error("Erro ao carregar produto:", error);
            toast({
                title: "Erro",
                description: "Falha ao carregar dados do produto",
                variant: "destructive",
            });
        }
    };

    // Esta função pode permanecer a mesma pois lida apenas com o upload local da imagem
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    form.setValue('image', reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!productId || !restaurantId) {
            toast({
                title: "Erro",
                description: "Dados do produto inválidos",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const formattedData = {
                ...values,
                price: parseFloat(values.price.replace(/[^\d.,]/g, '').replace(',', '.')),
                quantity: parseInt(values.quantity),
            };

            await updateProduct(String(productId), formattedData, String(restaurantId));

            toast({
                title: "Sucesso",
                description: "Produto atualizado com sucesso",
            });

            router.push(`/restaurant/${restaurantId}/products/${productId}`);
        } catch (error) {
            console.error("Erro ao atualizar produto:", error);
            toast({
                title: "Erro",
                description: "Falha ao atualizar produto",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-6 w-[785px]">
            <Card className="w-full bg-white">
                <CardContent className="p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column - Image */}
                                <div className="space-y-4">
                                    <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                        {form.watch('image') ? (
                                            <div className="relative h-full">
                                                <Image
                                                    src={form.watch('image') || ''}
                                                    alt="Preview"
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
                                    <FormField
                                        control={form.control}
                                        name="image"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Right Column - Form Fields */}
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome do produto</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Categoria</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione uma categoria" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {MENU_CATEGORIES.map(category => (
                                                            <SelectItem
                                                                key={category.id}
                                                                value={category.id}
                                                            >
                                                                {category.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Preço</FormLabel>
                                                    <FormControl>
                                                        <Input type='currency' {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="quantity"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Quantidade</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="number" min="0" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Descrição</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        rows={4}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="isAvailable"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Disponível</FormLabel>
                                                    <p className="text-sm text-gray-500">
                                                        Produto disponível para venda
                                                    </p>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
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
                                            Salvar Alterações
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
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}