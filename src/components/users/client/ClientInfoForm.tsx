"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import Logo from "@/../public/Logo.svg";
import AvatarUpload from "@/components/avatarUpload/AvatarUpload";
import { ArrowLeft, ArrowRight } from "lucide-react";

// URL do backend - idealmente isso deveria vir de uma variável de ambiente
const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3000";

export const formSchema = z
  .object({
    firstName: z.string().min(2, {
      message: "First name must be at least 2 characters.",
    }),
    lastName: z.string().min(2, {
      message: "Last name must be at least 2 characters.",
    }),
    email: z.string().email({
      message: "Please enter a valid email address.",
    }),
    phone: z.string().min(10, {
      message: "Phone number must be at least 10 digits.",
    }),
    password: z.string().min(6, {
      message: "Password must be at least 6 characters.",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

export default function ClientInfoForm() {
  const router = useRouter();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleImageChange = (file: File) => {
    console.log("Image file selected:", file.name);
    setAvatarFile(file);
  };

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      // Sempre usar FormData para consistência, mesmo sem avatar
      const formData = new FormData();
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("email", data.email);
      formData.append("phone", data.phone);
      formData.append("password", data.password);
      formData.append("role", "CLIENT");

      // Adicionar avatar apenas se existir
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      console.log("Sending form" + (avatarFile ? " with avatar" : ""));

      const response = await fetch(`${API_URL}/users/create`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.msg || `Error ${response.status}: Failed to create user`,
        );
      }

      const result = await response.json();

      toast({
        title: "Success!",
        description:
          result.msg || "Your account has been created successfully!",
        variant: "default",
      });

      router.push("/");
    } catch (error) {
      console.error("Registration error:", error);

      toast({
        title: "Registration failed",
        description:
          error instanceof Error ? error.message : "Please check your data.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <div className="flex w-full items-center justify-center p-6 md:w-1/2">
        <div className="w-full max-w-md">
          <h1 className="mb-6 text-2xl font-semibold">Crie sua conta</h1>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <AvatarUpload
                  size="lg"
                  onImageChange={handleImageChange}
                />
                <div className="flex flex-col">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primeiro Nome</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Segundo Nome</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Doe"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john.doe@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(99) 99999-9999"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirme sua senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="flex items-center"
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  className="flex items-center bg-black text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      Criar conta
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              <div className="py-6 text-start">
                <p className="text-md text-gray-500">
                  Já tem uma conta?
                  <Link
                    href="/login"
                    className="px-4 text-lg font-medium text-black hover:underline"
                  >
                    Entrar
                  </Link>
                </p>
              </div>
            </form>
          </Form>
        </div>
      </div>

      <div className="hidden flex-col items-center justify-center bg-black p-8 md:flex md:w-1/2">
        <div className="flex flex-1 items-center justify-center">
          <Image
            priority
            src={Logo}
            alt="SR. GARÇOM"
            width={400}
            height={120}
          />
        </div>
        <div className="mt-auto text-center text-sm text-white">
          <p>
            Ao entrar você concorda com os{" "}
            <Link
              href="#"
              className="text-white underline"
            >
              Termos de Uso
            </Link>{" "}
            e as{" "}
            <Link
              href="#"
              className="text-white underline"
            >
              Políticas de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
