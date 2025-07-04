'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
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
    isCombo: z.boolean().optional(), // Indica se é um combo
    comboOptions: z.array(z.object({
        name: z.string(),
        products: z.array(z.string())
    })).optional(), // Opções de combo
    isAdditional: z.boolean().default(false), // Indica se é um adicional
    hasAddons: z.boolean().default(false), // Indica se o produto tem adicionais
    additionalOptions: z.array(z.string()).optional().default([]), // Lista de adicionais
    hasAccompaniments: z.boolean().default(false), // Indica se o produto tem acompanhamentos
    accompaniments: z.array(z.object({
        id: z.string(), // ID do acompanhamento
        name: z.string(),
    })).optional(), // Acompanhamentos
});

type FormValues = z.infer<typeof formSchema>;

const CATEGORIES = [
    { id: 'accompaniments', name: 'Acompanhamentos' },
    { id: 'appetizers', name: 'Entradas' },
    { id: 'main', name: 'Pratos Principais' },
    { id: 'pizzas', name: 'Pizzas' },
    { id: 'burgers', name: 'Hambúrgueres' },
    { id: 'pastas', name: 'Massas' },
    { id: 'grills', name: 'Grelhados' },
    { id: 'seafood', name: 'Frutos do Mar' },
    { id: 'healthy', name: 'Saudável' },
    { id: 'sides', name: 'Acompanhamentos' },
    { id: 'specials', name: 'Especiais' },
    { id: 'vegan', name: 'Vegano' },
    { id: 'gluten-free', name: 'Sem Glúten' },
    { id: 'breakfast', name: 'Café da Manhã' },
    { id: 'snacks', name: 'Lanches' },
    { id: 'snacks2', name: 'Petiscos' },
    { id: 'salads', name: 'Saladas' },
    { id: 'addOns', name: 'Adicionais' },
    { id: 'soups', name: 'Sopas' },
    { id: 'international', name: 'Internacional' },
    { id: 'kids', name: 'Menu Infantil' },
    { id: 'cocktails', name: 'Coquetéis' },
    { id: 'smoothies', name: 'Smoothies' },
    { id: 'teas', name: 'Chás' },
    { id: 'coffees', name: 'Cafés' },
    { id: 'wines', name: 'Vinhos' },
    { id: 'beers', name: 'Cervejas' },
    { id: 'spirits', name: 'Destilados' },
    { id: 'drinks', name: 'Bebidas' },
    { id: 'desserts', name: 'Sobremesas' },
];

interface ProductFormProps {
    slug: string;
}

export default function ProductForm({ slug }: ProductFormProps) {
    const router = useRouter();
    const { session } = useAuthCheck();
    const { createProduct, products } = useProductStore();
    const [loading, setLoading] = useState(false);
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
            isCombo: false,
            discountPercentage: '',
            promotionalPrice: '',
            promotionStartDate: '',
            promotionEndDate: '',
            isAdditional: false,
            hasAddons: false,
            additionalOptions: [],
            hasAccompaniments: false,
            accompaniments: [],
        },
        mode: 'onSubmit',
        reValidateMode: 'onChange'
    });

    const { fields: accompanimentFields, append: appendAccompaniment } = useFieldArray({
        control: form.control,
        name: 'accompaniments',
    });

    const isOnPromotion = form.watch('isOnPromotion');
    const price = form.watch('price');
    const discountPercentage = form.watch('discountPercentage');
    const addons = form.watch('hasAddons');
    const selectedAccompaniments = form.watch('hasAccompaniments');

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

    const onSubmit = async (values: FormValues) => {
        console.log('Iniciando submit:', { restaurantId, sessionToken: session?.token });
        if (!restaurantId || !session?.token) {
            console.log('Submit bloqueado:', { restaurantId, sessionToken: session?.token });
            return;
        }

        setLoading(true);
        try {
            console.log('Valores do formulário:', values);

            const formattedPrice = parseFloat(values.price.replace(/[^\d.,]/g, '').replace(',', '.'));

            if (isNaN(formattedPrice) || formattedPrice <= 0) {
                throw new Error('Preço inválido');
            }

            const selectedAddons = Array.isArray(values.additionalOptions)
                ? values.additionalOptions.map((addon) => {
                    const addonId = typeof addon === 'string' ? addon : addon;
                    const addonProduct = products.find(p => p._id === addonId);
                    return addonProduct
                        ? {
                            id: addonProduct._id,
                            name: addonProduct.name,
                            price: addonProduct.price,
                            isAvailable: addonProduct.isAvailable,
                        }
                        : undefined;
                }).filter(addon => addon !== undefined)
                : [];

            const formattedData: any = {
                restaurant: restaurantId,
                name: values.name,
                category: values.category,
                price: formattedPrice,
                quantity: Number(values.quantity),
                description: values.description ?? '',
                image: values.image ?? '',
                isAvailable: values.isAvailable,
                isOnPromotion: values.isOnPromotion,
                discountPercentage: values.isOnPromotion ? Number(values.discountPercentage) : null,
                promotionalPrice: values.isOnPromotion ? Number(values.promotionalPrice) : null,
                promotionStartDate: values.isOnPromotion && values.promotionStartDate ? values.promotionStartDate : null,
                promotionEndDate: values.isOnPromotion && values.promotionEndDate ? values.promotionEndDate : null,
                isAdditional: values.isAdditional,
                hasAddons: values.hasAddons,
                additionalOptions: selectedAddons,
                hasAccompaniments: values.hasAccompaniments,
                accompaniments: (values.accompaniments ?? []).map((a, idx) => ({
                    id: `${a.name}-${idx}`,
                    name: a.name,
                    isAvailable: true,
                })),
            };

            console.log('Submitting product data:', formattedData);

            await createProduct(formattedData, restaurantId);

            toast({
                title: 'Sucesso',
                description: 'Produto adicionado com sucesso.'
            });

            router.push(`/admin/restaurant/${slug}/products`);
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
                        <form onSubmit={(e) => { e.preventDefault(); console.log("Form submetido"); console.log("Valores atuais:", form.getValues()); console.log("Erros:", form.formState.errors); form.handleSubmit(async (data) => { console.log("Dados validados:", data); await onSubmit(data); })(e); }} className="space-y-6">
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
                                                    type="currency"
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

                            {/* Switch and Section for Add-ons */}
                            <FormField
                                control={form.control}
                                name="hasAddons"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Adicionais</FormLabel>
                                            <FormDescription>
                                                Ativar opcionais com preço adicional
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

                            {addons && (
                                <div className="space-y-6 mt-4 p-4 border rounded-lg bg-muted/20">
                                    <h3 className="font-medium">Adicionais Disponíveis</h3>
                                    <Separator />
                                    {products.filter(p => p.category === 'addOns').length > 0 ? (
                                        products.filter(p => p.category === 'addOns').map((addon) => (
                                            addon._id && ( // Certifique-se de que addon._id existe
                                                <FormField
                                                    key={addon._id}
                                                    control={form.control}
                                                    name="additionalOptions"
                                                    render={({ field }) => (
                                                        <div className="flex items-center space-x-4">
                                                            <input
                                                                type="checkbox"
                                                                value={addon._id}
                                                                checked={((field.value ?? []).map((item: any) => typeof item === 'string' ? item : item?.id)).includes(addon._id)}
                                                                onChange={() => {
                                                                    const exists = (field.value ?? [])
                                                                        .map((item: any) => typeof item === 'string' ? item : item?.id)
                                                                        .includes(addon._id);
                                                                    const newValue = exists
                                                                        ? (field.value ?? []).filter((item: any) =>
                                                                            (typeof item === 'string' ? item : item?.id) !== addon._id
                                                                        )
                                                                        : [...(field.value ?? []), addon._id];
                                                                    field.onChange(newValue);
                                                                }}
                                                            />
                                                            <div className='flex flex-row w-full justify-between items-center border border-gray-300 p-2 rounded-lg'>
                                                                <span>{addon.name}</span>
                                                                <span className="text-sm text-gray-600">+ R$ {addon.price.toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                />
                                            )
                                        ))
                                    ) : (
                                        <p>Não há produtos adicionais cadastrados.</p>
                                    )}
                                </div>
                            )}

                            {/* Switch and Section for Accompaniments */}
                            <FormField
                                control={form.control}
                                name="hasAccompaniments"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Acompanhamentos</FormLabel>
                                            <FormDescription>
                                                Ativar opções de acompanhamento
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

                            {selectedAccompaniments && (
                                <div className="space-y-6 mt-4 p-4 border rounded-lg bg-muted/20">
                                    <h3 className="font-medium">Acompanhamentos</h3>
                                    <Separator />

                                    {accompanimentFields.map((accompaniment, index) => (
                                        <div key={accompaniment.id} className="flex space-x-4">
                                            <FormField
                                                control={form.control}
                                                name={`accompaniments.${index}.name`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-grow">
                                                        <FormLabel>Nome do Acompanhamento</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Ex: Arroz branco" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => appendAccompaniment({ name: '', id: crypto.randomUUID() })}
                                    >
                                        Adicionar Acompanhamento
                                    </Button>
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
                                <Button type="submit" disabled={loading} onClick={() => console.log('Botão clicado')}>
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