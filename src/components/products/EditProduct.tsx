"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Save, X, Loader2 } from "lucide-react";
import { extractIdFromSlug } from "@/utils/slugify";
import { Card, CardContent } from "@/components/ui/card";
import { MENU_CATEGORIES } from "@/components/products/types";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";
import { useProductStore } from "@/stores";

const formSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  category: z.string().min(1, { message: "Selecione uma categoria" }),
  price: z.string().refine(
    (val) => {
      const numericString = val.replace(/[^\d.,]/g, "").replace(",", ".");
      const number = parseFloat(numericString);
      return !isNaN(number) && number > 0;
    },
    { message: "Preço deve ser um número positivo" },
  ),
  costPrice: z.string().refine(
    (val) => {
      const numericString = val.replace(/[^\d.,]/g, "").replace(",", ".");
      const number = parseFloat(numericString);
      return !isNaN(number) && number >= 0;
    },
    { message: "Custo deve ser um número positivo" },
  ),
  description: z.string().optional(),
  quantity: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Quantidade deve ser um número positivo",
    }),
  // mantém para compat com API (URL já salva); não vamos mais colocar base64 aqui
  image: z.string().optional(),
  isAvailable: z.boolean().default(true),
});

type LoadedProduct = {
  _id: string;
  name: string;
  category: string;
  price: number;
  costPrice?: number;
  description?: string;
  quantity: number;
  image?: string;
  imageBlur?: string;
  isAvailable: boolean;
};

export default function ProductEdit() {
  const { slug, productId } = useParams();
  const router = useRouter();
  const { status } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // imagem atual do servidor
  const [serverImage, setServerImage] = useState<string>("");
  const [serverBlur, setServerBlur] = useState<string | undefined>(undefined);

  // novo arquivo selecionado localmente
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { fetchProductById, updateProduct } = useProductStore();
  const restaurantId = slug && extractIdFromSlug(String(slug));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      price: "",
      costPrice: "",
      description: "",
      quantity: "0",
      image: "",
      isAvailable: true,
    },
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (productId && restaurantId) {
      fetchProductDetails();
    }
    // limpa o blob URL quando desmontar
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, restaurantId]);

  const fetchProductDetails = async () => {
    try {
      if (!productId || !restaurantId)
        throw new Error("Dados do produto inválidos");

      const data = await fetchProductById(
        String(productId),
        String(restaurantId),
      );

      if (!data) throw new Error("Produto não encontrado");

      setServerImage(data.image || "");
      setServerBlur(data.imageBlur);

      form.reset({
        name: data.name,
        category: data.category,
        price: String(data.price ?? ""),
        costPrice: data.costPrice != null ? String(data.costPrice) : "",
        description: data.description || "",
        quantity: String(data.quantity ?? "0"),
        image: data.image || "",
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

  // Upload local: não gravamos base64 no form; guardamos File + preview
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // limpa preview anterior
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);
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
      const priceNum = parseFloat(
        values.price.replace(/[^\d.,]/g, "").replace(",", "."),
      );
      const costNum = parseFloat(
        values.costPrice.replace(/[^\d.,]/g, "").replace(",", "."),
      );
      const quantityNum = parseInt(values.quantity, 10);

      const common = {
        name: values.name,
        category: values.category,
        price: priceNum,
        costPrice: costNum,
        description: values.description || "",
        quantity: Number.isNaN(quantityNum) ? 0 : quantityNum,
        isAvailable: values.isAvailable,
      };

      let payload: any = common;

      // Se o usuário escolheu nova imagem -> multipart (field "image")
      if (selectedFile) {
        const fd = new FormData();
        Object.entries(common).forEach(([k, v]) => fd.append(k, String(v)));
        fd.append("image", selectedFile);
        payload = fd;
      } else {
        // se não trocou a imagem, mantemos a URL atual (quando houver)
        if (serverImage) payload.image = serverImage;
      }

      // ⚠️ seu store deve detectar se "payload instanceof FormData"
      await updateProduct(String(productId), payload, String(restaurantId));

      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso",
      });
      router.back();
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
    <div className="container mx-auto w-[785px] px-4 py-6">
      <Card className="w-full bg-white">
        <CardContent className="p-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Left Column - Image */}
                <div className="space-y-4">
                  <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                    {/* 1) Se escolheu arquivo agora: usa <img> com blob URL (apenas preview) */}
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : serverImage ? (
                      // 2) senão, renderiza a imagem atual do servidor com blur (quando existir)
                      <div className="relative h-full">
                        <Image
                          src={serverImage}
                          alt="Imagem do produto"
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          quality={70}
                          {...(serverBlur
                            ? {
                                placeholder: "blur" as const,
                                blurDataURL: serverBlur,
                              }
                            : {})}
                        />
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        Sem imagem
                      </div>
                    )}
                  </div>

                  {/* Input de arquivo (nova imagem) */}
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
                            {MENU_CATEGORIES.map((category) => (
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
                            <Input
                              type="currency"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="costPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço de custo</FormLabel>
                          <FormControl>
                            <Input
                              type="currency"
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
                              {...field}
                              type="number"
                              min="0"
                            />
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
                        <Save
                          size={20}
                          className="mr-2"
                        />
                      )}
                      Salvar Alterações
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                    >
                      <X
                        size={20}
                        className="mr-2"
                      />
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
