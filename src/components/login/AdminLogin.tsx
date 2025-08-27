"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";
import { DelayedLoading } from "@/components/loading/DelayedLoading";
import { getSession, signIn } from "next-auth/react";
import { useToast } from "@/hooks/useToast";
import { generateRestaurantSlug } from "@/utils/slugify";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { isLoading, setLoading, updateFromSession } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!result || result.error)
        throw new Error(result?.error || "Falha na autenticação");

      // Sessão válida -> pega dados do NextAuth
      const session = await getSession();

      // Mantém Zustand em sincronia
      updateFromSession(session);

      // Redireciona
      const user = session?.user as any;
      const slug = user?.restaurantName
        ? generateRestaurantSlug(user.restaurantName, user.restaurantId)
        : user?.restaurantId;

      if (user?.role === "ADMIN")
        router.push(`/admin/restaurant/${slug}/dashboard`);
      else if (user?.role === "MANAGER")
        router.push(`/admin/restaurant/${slug}/manager`);
    } catch (err) {
      console.error(err);
      setError("Erro ao processar login");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <DelayedLoading />;

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <div className="relative flex h-64 flex-col items-center justify-center bg-black p-8 md:min-h-screen md:w-2/3">
        <Image
          src="/Logo.svg"
          alt="SR. GARÇOM"
          width={400}
          height={150}
          className="mx-auto"
        />
        <div className="absolute bottom-4 space-y-8 px-8 text-center text-xs text-white">
          <p>
            Ao entrar você concorda com os{" "}
            <Link
              href="/termos"
              className="underline"
            >
              Termos de uso
            </Link>{" "}
            e a{" "}
            <Link
              href="/privacidade"
              className="underline"
            >
              Política de privacidade
            </Link>
          </p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-white p-8 md:w-1/3">
        <div className="w-full max-w-md space-y-10">
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {error && (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium"
                >
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link
                href="/recover-password"
                className="text-sm hover:underline"
              >
                Esqueceu sua senha?
              </Link>
              <Button
                type="submit"
                className="bg-black text-white hover:bg-gray-800"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </div>
          </form>

          <div className="border-t border-gray-200 pt-6 text-center text-sm text-gray-500">
            <p>Não tem uma conta?</p>
            <Link
              href="/admin/register"
              className="text-md mt-2 block rounded-md border border-gray-300 px-4 py-2 font-semibold text-primary hover:bg-primary hover:text-secondary"
            >
              Criar uma conta agora
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
