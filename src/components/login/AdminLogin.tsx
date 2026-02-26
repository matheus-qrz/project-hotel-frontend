"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores";
import { DelayedLoading } from "@/components/loading/DelayedLoading";
import { getSession, signIn } from "next-auth/react";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/useMobile";

// IMPORTS DO DIALOG
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function Login() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { isLoading, setLoading, updateFromSession } = useAuthStore();

  // "admin" = administrador/gerente | "attendant" = recepcionista/funcionário
  const [loginMode, setLoginMode] = useState<"admin" | "attendant" | null>(
    null,
  );
  const [showModeDialog, setShowModeDialog] = useState(true);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        toast({
          title: "Credenciais inválidas",
          variant: "destructive",
        });
        throw new Error(result?.error || "Falha na autenticação");
      }

      // Sessão válida -> pega dados do NextAuth
      const session = await getSession();
      if (!session?.user) {
        throw new Error("Sessão não encontrada após login");
      }

      // Mantém Zustand em sincronia
      updateFromSession(session);

      // Redireciona baseado no role
      const hotelId = (session.user as any).hotelId ?? null;

      if (session.user.role === "ADMIN") {
        router.push(`/admin/hotel/${hotelId}/dashboard`);
      } else if (session.user.role === "MANAGER") {
        router.push(`/admin/hotel/${hotelId}/manager`);
      } else if (session.user.role === "ATTENDANT") {
        router.push(`/admin/hotel/${hotelId}/attendant`);
      }
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
      {/* DIALOG de escolha de forma de login */}
      <Dialog
        open={showModeDialog}
        onOpenChange={(open) => {
          setShowModeDialog(open);
          // se o usuário fechar à força sem escolher nada, assume admin/gerente
          if (!open && !loginMode) {
            setLoginMode("admin");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Qual a forma de Login?</DialogTitle>
            <DialogDescription>
              Escolha como deseja acessar o sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            <Button
              className="w-full"
              onClick={() => {
                setLoginMode("admin");
                setShowModeDialog(false);
              }}
            >
              Sou administrador/gerente
            </Button>

            <Button
              className="w-full"
              variant="secondary"
              onClick={() => {
                setLoginMode("attendant");
                setShowModeDialog(false);
              }}
            >
              Sou recepcionista/funcionário
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lado da imagem */}
      <div className="relative h-56 w-full overflow-hidden md:h-screen md:w-2/3">
        <Image
          src="/home-background.jpg"
          alt="Wallpaper"
          fill
          className="object-cover"
          priority
        />
        {!isMobile && (
          <div className="absolute bottom-4 left-1/2 w-[90%] -translate-x-1/2 space-y-2 rounded-xl bg-black/80 p-2 px-4 text-center text-xs text-white md:w-auto md:px-8">
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
        )}
      </div>

      {/* Lado do formulário */}
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
                  htmlFor="identifier"
                  className="block text-sm font-medium"
                >
                  {loginMode === "attendant" ? "CPF" : "Email ou CPF"}
                </label>
                <Input
                  id="identifier"
                  type="text"
                  inputMode="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>

              {/* Campo de senha só para admin/gerente */}
              {loginMode !== "attendant" && (
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
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}
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
                disabled={isLoading || !loginMode}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : loginMode === "attendant" ? (
                  "Entrar como funcionário"
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
