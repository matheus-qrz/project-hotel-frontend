"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Mail, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores";
import { DelayedLoading } from "@/components/loading/DelayedLoading";
import { getSession, signIn } from "next-auth/react";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/useMobile";

export default function Login() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { toast } = useToast();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { isLoading, setLoading, updateFromSession } = useAuthStore();

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
        toast({ title: "Credenciais inválidas", variant: "destructive" });
        throw new Error(result?.error || "Falha na autenticação");
      }

      const session = await getSession();
      if (!session?.user) throw new Error("Sessão não encontrada após login");

      updateFromSession(session);

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
      setError("Credenciais inválidas. Verifique e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <DelayedLoading />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes roomlyFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .roomly-fadein       { animation: roomlyFadeUp 0.8s ease both; }
        .roomly-fadein-delay { animation: roomlyFadeUp 0.8s 0.18s ease both; }
      `}</style>

      <div
        className="flex min-h-screen w-full flex-col md:flex-row"
        style={{ fontFamily: "'DM Sans', sans-serif", background: "#0D0D0D" }}
      >
        {/* ── PAINEL ESQUERDO ── */}
        <div
          className="relative hidden overflow-hidden md:flex md:w-[52%] md:items-center md:justify-center"
          style={{ borderRight: "1px solid rgba(201,169,110,0.2)" }}
        >
          {/* Imagem de fundo */}
          <Image
            src="/hotel-wallpaper.jpg"
            alt="Wallpaper"
            fill
            className="object-cover"
            priority
            style={{ opacity: 0.15 }}
          />

          {/* Glow dourado */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 65% 55% at 40% 45%, rgba(201,169,110,0.13) 0%, transparent 65%)," +
                "radial-gradient(ellipse 40% 50% at 75% 75%, rgba(201,169,110,0.07) 0%, transparent 55%)",
            }}
          />

          {/* Linhas decorativas */}
          {[
            { w: "1px", h: "55%", t: "22%", l: "22%" },
            { w: "1px", h: "38%", t: "31%", l: "78%" },
            { w: "48%", h: "1px", t: "28%", l: "22%" },
            { w: "30%", h: "1px", t: "72%", l: "22%" },
          ].map((s, i) => (
            <span
              key={i}
              className="pointer-events-none absolute"
              style={{
                width: s.w,
                height: s.h,
                top: s.t,
                left: s.l,
                background: "rgba(201,169,110,0.1)",
              }}
            />
          ))}

          {/* Conteúdo central */}
          <div className="roomly-fadein relative z-10 flex flex-col items-center px-12 text-center">
            {/* ── NOVO LOGO ── */}
            <svg
              width="120"
              height="120"
              viewBox="0 0 130 130"
              fill="none"
              className="mb-5"
            >
              {/* Anel externo pontilhado */}
              <circle
                cx="65"
                cy="65"
                r="62"
                stroke="#C9A96E"
                strokeWidth="0.6"
                strokeDasharray="3 5"
                opacity="0.35"
              />
              {/* Anel médio sólido */}
              <circle
                cx="65"
                cy="65"
                r="54"
                stroke="#C9A96E"
                strokeWidth="0.8"
                opacity="0.5"
              />
              {/* Anel interno fino */}
              <circle
                cx="65"
                cy="65"
                r="46"
                stroke="#C9A96E"
                strokeWidth="0.4"
                opacity="0.25"
              />

              {/* Telhado / frontão */}
              <path
                d="M65 22 L90 42 L40 42 Z"
                fill="none"
                stroke="#C9A96E"
                strokeWidth="1.2"
                strokeLinejoin="round"
                opacity="0.9"
              />
              {/* Pináculo */}
              <line
                x1="65"
                y1="14"
                x2="65"
                y2="22"
                stroke="#C9A96E"
                strokeWidth="1.2"
                opacity="0.7"
              />
              <circle
                cx="65"
                cy="12"
                r="2.5"
                fill="#C9A96E"
                opacity="0.8"
              />

              {/* Fachada do prédio */}
              <rect
                x="42"
                y="42"
                width="46"
                height="38"
                fill="none"
                stroke="#C9A96E"
                strokeWidth="1"
                opacity="0.7"
              />

              {/* Janelas — linha superior */}
              <rect
                x="49"
                y="49"
                width="8"
                height="7"
                rx="1"
                fill="#C9A96E"
                opacity="0.5"
              />
              <rect
                x="61"
                y="49"
                width="8"
                height="7"
                rx="1"
                fill="#C9A96E"
                opacity="0.5"
              />
              <rect
                x="73"
                y="49"
                width="8"
                height="7"
                rx="1"
                fill="#C9A96E"
                opacity="0.5"
              />
              {/* Janelas — linha inferior */}
              <rect
                x="49"
                y="61"
                width="8"
                height="7"
                rx="1"
                fill="#C9A96E"
                opacity="0.28"
              />
              <rect
                x="61"
                y="61"
                width="8"
                height="7"
                rx="1"
                fill="#C9A96E"
                opacity="0.28"
              />
              <rect
                x="73"
                y="61"
                width="8"
                height="7"
                rx="1"
                fill="#C9A96E"
                opacity="0.28"
              />

              {/* Porta em arco */}
              <path
                d="M59 80 L59 70 Q65 64 71 70 L71 80 Z"
                fill="#C9A96E"
                opacity="0.6"
              />

              {/* Sino de serviço */}
              <rect
                x="50"
                y="97"
                width="30"
                height="2.5"
                rx="1.25"
                fill="#DFC28E"
                opacity="0.9"
              />
              <path
                d="M65 88 C57 88 52 92 52 97 L78 97 C78 92 73 88 65 88Z"
                fill="#C9A96E"
                opacity="0.85"
              />
              <rect
                x="63"
                y="84"
                width="4"
                height="5"
                rx="2"
                fill="#C9A96E"
                opacity="0.7"
              />

              {/* Ornamentos laterais */}
              <circle
                cx="33"
                cy="55"
                r="1.4"
                fill="#C9A96E"
                opacity="0.25"
              />
              <circle
                cx="97"
                cy="55"
                r="1.4"
                fill="#C9A96E"
                opacity="0.25"
              />
              <circle
                cx="33"
                cy="75"
                r="0.9"
                fill="#C9A96E"
                opacity="0.18"
              />
              <circle
                cx="97"
                cy="75"
                r="0.9"
                fill="#C9A96E"
                opacity="0.18"
              />
              <path
                d="M30 65 Q25 60 28 54"
                stroke="#C9A96E"
                strokeWidth="0.8"
                fill="none"
                opacity="0.2"
              />
              <path
                d="M30 65 Q24 65 26 72"
                stroke="#C9A96E"
                strokeWidth="0.8"
                fill="none"
                opacity="0.2"
              />
              <path
                d="M100 65 Q105 60 102 54"
                stroke="#C9A96E"
                strokeWidth="0.8"
                fill="none"
                opacity="0.2"
              />
              <path
                d="M100 65 Q106 65 104 72"
                stroke="#C9A96E"
                strokeWidth="0.8"
                fill="none"
                opacity="0.2"
              />
            </svg>

            <h1
              className="uppercase"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 300,
                fontSize: "3.8rem",
                letterSpacing: "0.18em",
                color: "#F0EDE8",
                lineHeight: 1,
              }}
            >
              Roomly
            </h1>

            <p
              className="mt-2 text-xs uppercase tracking-[0.35em]"
              style={{ color: "#C9A96E" }}
            >
              Gestão de Hospitalidade
            </p>

            {/* Divider com dots */}
            <div className="my-8 flex w-60 items-center gap-4">
              <span
                className="flex-1"
                style={{ height: "1px", background: "rgba(201,169,110,0.2)" }}
              />
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1 w-1 shrink-0 rounded-full"
                  style={{ background: "#C9A96E" }}
                />
              ))}
              <span
                className="flex-1"
                style={{ height: "1px", background: "rgba(201,169,110,0.2)" }}
              />
            </div>

            <p
              className="max-w-[270px] leading-7"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: "1.15rem",
                color: "rgba(240,237,232,0.38)",
              }}
            >
              Gerencie seu estabelecimento com elegância e precisão.
            </p>
          </div>

          {/* Termos — desktop */}
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl px-7 py-2 text-center text-[0.68rem]"
            style={{
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(201,169,110,0.15)",
              color: "rgba(240,237,232,0.4)",
            }}
          >
            Ao entrar você concorda com os{" "}
            <Link
              href="/termos"
              className="underline"
              style={{ color: "#C9A96E" }}
            >
              Termos de uso
            </Link>{" "}
            e a{" "}
            <Link
              href="/privacidade"
              className="underline"
              style={{ color: "#C9A96E" }}
            >
              Política de privacidade
            </Link>
          </div>
        </div>

        {/* ── PAINEL DIREITO — formulário ── */}
        <div
          className="relative flex flex-1 items-center justify-center p-8"
          style={{ background: "#141414" }}
        >
          {/* Faixa dourada lateral */}
          <span
            className="pointer-events-none absolute left-0 top-0 hidden md:block"
            style={{
              width: "3px",
              height: "100%",
              background:
                "linear-gradient(to bottom, transparent, #C9A96E 40%, #DFC28E 60%, transparent)",
            }}
          />

          <div className="roomly-fadein-delay w-full max-w-[380px]">
            {/* Cabeçalho */}
            <p
              className="mb-2 text-[0.68rem] font-medium uppercase tracking-[0.3em]"
              style={{ color: "#C9A96E" }}
            >
              Área do Estabelecimento
            </p>

            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "2.5rem",
                fontWeight: 400,
                color: "#F0EDE8",
                lineHeight: 1.15,
              }}
            >
              Bem-vindo
              <br />
              de volta
            </h2>

            <p
              className="mb-10 mt-2 text-[0.82rem] font-light"
              style={{ color: "#6B6560" }}
            >
              Acesse o painel de gestão do seu hotel
            </p>

            {/* Erro */}
            {error && (
              <div
                className="mb-5 rounded px-4 py-3 text-[0.82rem]"
                style={{
                  border: "1px solid rgba(220,38,38,0.3)",
                  background: "rgba(220,38,38,0.08)",
                  color: "#f87171",
                }}
              >
                {error}
              </div>
            )}

            {/* Formulário */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
            >
              {/* Email ou CPF */}
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="identifier"
                  className="text-[0.7rem] uppercase tracking-[0.14em]"
                  style={{ color: "#6B6560" }}
                >
                  Email ou CPF
                </Label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#6B6560" }}
                  />
                  <Input
                    id="identifier"
                    type="text"
                    inputMode="text"
                    autoComplete="username"
                    placeholder="contato@seuhotel.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    className="pl-9 focus-visible:ring-[#C9A96E]"
                    style={{
                      background: "#1A1A1A",
                      borderColor: "rgba(201,169,110,0.2)",
                      color: "#F0EDE8",
                      height: "2.75rem",
                    }}
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="password"
                  className="text-[0.7rem] uppercase tracking-[0.14em]"
                  style={{ color: "#6B6560" }}
                >
                  Senha
                </Label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#6B6560" }}
                  />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9 focus-visible:ring-[#C9A96E]"
                    style={{
                      background: "#1A1A1A",
                      borderColor: "rgba(201,169,110,0.2)",
                      color: "#F0EDE8",
                      height: "2.75rem",
                    }}
                  />
                </div>
                <div className="flex justify-end">
                  <Link
                    href="/recover-password"
                    className="text-[0.74rem] hover:opacity-75"
                    style={{ color: "#C9A96E" }}
                  >
                    Esqueci minha senha
                  </Link>
                </div>
              </div>

              {/* Botão */}
              <Button
                type="submit"
                disabled={isLoading}
                className="mt-1 h-11 w-full text-[0.75rem] font-medium uppercase tracking-[0.25em] transition-opacity hover:opacity-90"
                style={{ background: "#C9A96E", color: "#0D0D0D" }}
              >
                {isLoading ? (
                  <>
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                    Entrando...
                  </>
                ) : (
                  "Entrar no painel"
                )}
              </Button>
            </form>

            {/* Rodapé */}
            <div
              className="mt-8 pt-6 text-center"
              style={{ borderTop: "1px solid rgba(201,169,110,0.1)" }}
            >
              <p
                className="text-[0.75rem]"
                style={{ color: "#6B6560" }}
              >
                Não tem uma conta?
              </p>
              <Link
                href="/register"
                className="mt-2 block rounded px-4 py-2.5 text-[0.75rem] tracking-[0.1em] transition-colors hover:opacity-80"
                style={{
                  border: "1px solid rgba(201,169,110,0.3)",
                  color: "#C9A96E",
                }}
              >
                Criar uma conta agora
              </Link>
            </div>
          </div>

          {/* Termos — mobile */}
          {isMobile && (
            <p
              className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[0.65rem]"
              style={{ color: "rgba(107,101,96,0.5)" }}
            >
              <Link
                href="/termos"
                style={{ color: "#C9A96E" }}
              >
                Termos
              </Link>
              {" · "}
              <Link
                href="/privacidade"
                style={{ color: "#C9A96E" }}
              >
                Privacidade
              </Link>
            </p>
          )}

          {/* Ornamento */}
          <span
            className="absolute bottom-6 right-7 text-[0.6rem] uppercase tracking-[0.2em]"
            style={{ color: "rgba(107,101,96,0.3)" }}
          >
            © 2025 Roomly
          </span>
        </div>
      </div>
    </>
  );
}
