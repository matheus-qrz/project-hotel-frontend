'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormDescription,
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
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useProductStore } from '@/stores/products';
import { Separator } from '@/components/ui/separator';
import { useAuthCheck } from '@/hooks/sessionManager';
import { extractIdFromSlug } from '@/utils/slugify';
import { Product } from '@/stores/products/productStore';

const formSchema = z.object({
    name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
    category: z.string().min(1, { message: 'Selecione uma categoria' }),
    price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: 'Preço deve ser um número positivo',
    }),
    description: z.string().optional(),
    quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: 'Quantidade deve ser um número positivo',
    }),
    image: z.string().optional(),
    isAvailable: z.boolean().default(true),
    isOnPromotion: z.boolean().default(false),
    discountPercentage: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 100), {
        message: 'Percentual de desconto deve ser entre 0 e 100',
    }),
    promotionalPrice: z.string().optional(),
    promotionStartDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Data de início inválida',
    }),
    promotionEndDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Data de término inválida',
    }),
});

type FormValues = z.infer<typeof formSchema>;

const CATEGORIES = [
    { id: 'appetizers', name: 'Entradas' },
    { id: 'main', name: 'Pratos Principais' },
    { id: 'desserts', name: 'Sobremesas' },
    { id: 'drinks', name: 'Bebidas' },
    { id: 'sides', name: 'Acompanhamentos' },
];

interface ProductFormProps {
    slug: string;
}

export default function ProductForm({ slug }: ProductFormProps) {
    const router = useRouter();
    const { session } = useAuthCheck();
    const { createProduct } = useProductStore();
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();

    const restaurantId = slug && extractIdFromSlug(String(slug));

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            category: '',
            price: '',
            description: '',
            quantity: '1',
            image: '',
            isAvailable: true,
            isOnPromotion: false,
            discountPercentage: '',
            promotionalPrice: '',
            promotionStartDate: '',
            promotionEndDate: '',
        },
    });

    const isOnPromotion = form.watch('isOnPromotion');
    const price = form.watch('price');
    const discountPercentage = form.watch('discountPercentage');

    useEffect(() => {
        if (isOnPromotion && price && discountPercentage) {
            const priceNum = Number(price);
            const discountNum = Number(discountPercentage);
            if (!isNaN(priceNum) && !isNaN(discountNum)) {
                const calculatedPrice = priceNum * (1 - discountNum / 100);
                form.setValue('promotionalPrice', calculatedPrice.toFixed(2));
            }
        }
    }, [price, discountPercentage, isOnPromotion, form]);

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

    // Ajuste o onSubmit para converter os valores corretamente:
    const onSubmit = async (values: FormValues) => {
        if (!restaurantId || !session?.token) return;

        setLoading(true);
        try {
            // Garantindo que os tipos correspondam exatamente ao esperado pelo createProduct
            const formattedData: Omit<Product, '_id'> = {
                name: values.name,
                category: values.category,
                price: Number(values.price),
                quantity: Number(values.quantity),
                description: values.description ?? '',
                image: values.image ?? '',
                isAvailable: values.isAvailable,
                isOnPromotion: values.isOnPromotion,
                // Campos promocionais com valores padrão quando não em promoção
                discountPercentage: values.isOnPromotion ? Number(values.discountPercentage) : 0,
                promotionalPrice: values.isOnPromotion ? Number(values.promotionalPrice) : 0,
                promotionStartDate: values.isOnPromotion ? values.promotionStartDate ?? '' : '',
                promotionEndDate: values.isOnPromotion ? values.promotionEndDate ?? '' : ''
            };

            await createProduct(formattedData, restaurantId);

            toast({
                title: 'Sucesso',
                description: 'Produto adicionado com sucesso.'
            });

            router.push(`/restaurant/${slug}/products`);
        } catch (error) {
            console.error('Erro ao criar produto:', error);
            toast({
                title: 'Erro',
                variant: 'destructive',
                description: 'Erro ao cadastrar o produto.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 max-w-3xl">
            <Card>
                <CardContent className="pt-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome do produto *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Sushi de salmão" {...field} />
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
                                            <FormLabel>Categoria *</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione uma categoria" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {CATEGORIES.map((category) => (
                                                        <SelectItem key={category.id} value={category.id}>
                                                            {category.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Preço *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="0,00"
                                                    {...field}
                                                />
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
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    placeholder="1"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="image"
                                    render={({ field }) => (
                                        <FormItem className="col-span-1 md:col-span-2">
                                            <FormLabel>Carregar imagem</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Selecione uma imagem do seu dispositivo (recomendado: 500x500px)
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem className="col-span-1 md:col-span-2">
                                            <FormLabel>Descrição</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Descreva o produto..."
                                                    rows={3}
                                                    {...field}
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
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Disponível</FormLabel>
                                                <FormDescription>
                                                    O produto está disponível para venda
                                                </FormDescription>
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

                                <FormField
                                    control={form.control}
                                    name="isOnPromotion"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Em promoção</FormLabel>
                                                <FormDescription>
                                                    Ativar desconto promocional
                                                </FormDescription>
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
                            </div>

                            {isOnPromotion && (
                                <div className="space-y-6 mt-4 p-4 border rounded-lg bg-muted/20">
                                    <h3 className="font-medium">Detalhes da promoção</h3>
                                    <Separator />

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

                                        <FormField
                                            control={form.control}
                                            name="promotionalPrice"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Preço promocional</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            placeholder="0,00"
                                                            {...field}
                                                            readOnly
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Calculado automaticamente com base no desconto
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

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
                                </div>
                            )}

                            <div className="flex justify-end space-x-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Salvar produto
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
