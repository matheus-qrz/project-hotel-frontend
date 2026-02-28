"use client";

// app/(auth)/register/page.tsx

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/useToast";

import { useAuthStore } from "@/stores";
import { OwnerSection } from "@/components/register/OwnerSection";
import { HotelSection } from "@/components/register/HotelSection";
import { LogoSection } from "@/components/register/LogoSection";
import { SummarySection } from "@/components/register/SummarySection";
import {
  OwnerForm,
  HotelForm,
  RegisterErrors,
  buildRegisterPayload,
} from "@/components/register/register";

// ── Initial states ────────────────────────────────────────────────────────────
const OWNER_INIT: OwnerForm = {
  firstName: "",
  lastName: "",
  cpf: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const HOTEL_INIT: HotelForm = {
  name: "",
  type: "",
  cnpj: "",
  phone: "",
  email: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  zipCode: "",
};

// ── Validation ────────────────────────────────────────────────────────────────
function validate(owner: OwnerForm, hotel: HotelForm): RegisterErrors {
  const e: RegisterErrors = {};

  // Owner
  if (!owner.firstName) e.firstName = "Obrigatório";
  if (!owner.lastName) e.lastName = "Obrigatório";
  if (!owner.cpf || owner.cpf.length < 14) e.cpf = "CPF inválido";
  if (!owner.email) e.email = "Obrigatório";
  if (!owner.password || owner.password.length < 6)
    e.password = "Mínimo 6 caracteres";
  if (owner.password !== owner.confirmPassword)
    e.confirmPassword = "Senhas não conferem";

  // Hotel
  if (!hotel.name) e.hotelName = "Obrigatório";
  if (!hotel.type) e.hotelType = "Selecione o tipo";
  if (!hotel.cnpj || hotel.cnpj.length < 18) e.cnpj = "CNPJ inválido";
  if (!hotel.street) e.street = "Obrigatório";
  if (!hotel.number) e.number = "Obrigatório";
  if (!hotel.city) e.city = "Obrigatório";
  if (!hotel.state) e.state = "Obrigatório";
  if (!hotel.zipCode || hotel.zipCode.length < 9) e.zipCode = "CEP inválido";

  return e;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Uses authStore.registerAdminWithHotel which calls POST /hotel/create
  // and persists token + hotelId + unitId on success
  const { registerAdminWithHotel, isLoading } = useAuthStore();

  const [owner, setOwnerState] = useState<OwnerForm>(OWNER_INIT);
  const [hotel, setHotelState] = useState<HotelForm>(HOTEL_INIT);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<RegisterErrors>({});

  // ── Field helpers ─────────────────────────────────────────────────────────
  function handleOwnerChange(field: keyof OwnerForm, value: string) {
    setOwnerState((prev) => ({ ...prev, [field]: value }));
    if (errors[field])
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
  }

  function handleHotelChange(field: keyof HotelForm, value: string) {
    setHotelState((prev) => ({ ...prev, [field]: value }));
    if (errors[field])
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
  }

  function handleLogoSelect(file: File, preview: string) {
    setLogoFile(file);
    setLogoPreview(preview);
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate
    const validationErrors = validate(owner, hotel);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast({ title: "Corrija os campos destacados", variant: "destructive" });
      const firstId = Object.keys(validationErrors)[0];
      document
        .getElementById(firstId)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Build flat payload aligned with HotelController.registerAdminWithHotel()
    // and RegisterAdminWithHotelPayload in authStore.ts
    const payload = buildRegisterPayload(owner, hotel);

    // Delegate to authStore — handles fetch + token persistence
    const result = await registerAdminWithHotel(payload);

    if (!result.success) {
      toast({ title: result.message, variant: "destructive" });
      return;
    }

    toast({ title: "Cadastro realizado com sucesso!" });

    // authStore already has token + hotelId — redirect to admin dashboard
    const hotelId = result.hotel?._id;
    router.push(hotelId ? `/admin/hotel/${hotelId}/dashboard` : "/login");
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes roomlyFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .s-fade   { animation: RoomlyFadeUp 0.7s ease both; }
        .s-fade-1 { animation: RoomlyFadeUp 0.7s 0.08s ease both; }
        .s-fade-2 { animation: RoomlyFadeUp 0.7s 0.16s ease both; }
        .s-fade-3 { animation: RoomlyFadeUp 0.7s 0.24s ease both; }
        .s-fade-4 { animation: RoomlyFadeUp 0.7s 0.32s ease both; }
      `}</style>

      <div
        className="min-h-screen w-full"
        style={{ fontFamily: "'DM Sans', sans-serif", background: "#0D0D0D" }}
      >
        {/* ── Top bar ── */}
        <div
          className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
          style={{
            background: "rgba(13,13,13,0.92)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(201,169,110,0.12)",
          }}
        >
          <div className="flex items-center gap-3">
            <svg
              width="32"
              height="32"
              viewBox="0 0 130 130"
              fill="none"
            >
              <circle
                cx="65"
                cy="65"
                r="62"
                stroke="#C9A96E"
                strokeWidth="1"
                opacity="0.4"
                strokeDasharray="3 5"
              />
              <circle
                cx="65"
                cy="65"
                r="54"
                stroke="#C9A96E"
                strokeWidth="1"
                opacity="0.5"
              />
              <path
                d="M65 22 L90 42 L40 42 Z"
                fill="none"
                stroke="#C9A96E"
                strokeWidth="2"
                strokeLinejoin="round"
                opacity="0.9"
              />
              <line
                x1="65"
                y1="14"
                x2="65"
                y2="22"
                stroke="#C9A96E"
                strokeWidth="2"
                opacity="0.7"
              />
              <circle
                cx="65"
                cy="12"
                r="3"
                fill="#C9A96E"
                opacity="0.8"
              />
              <rect
                x="42"
                y="42"
                width="46"
                height="38"
                fill="none"
                stroke="#C9A96E"
                strokeWidth="1.5"
                opacity="0.7"
              />
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
              <path
                d="M59 80 L59 70 Q65 64 71 70 L71 80 Z"
                fill="#C9A96E"
                opacity="0.6"
              />
              <path
                d="M65 88 C57 88 52 92 52 97 L78 97 C78 92 73 88 65 88Z"
                fill="#C9A96E"
                opacity="0.85"
              />
              <rect
                x="50"
                y="97"
                width="30"
                height="2.5"
                rx="1.25"
                fill="#DFC28E"
                opacity="0.9"
              />
            </svg>
            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1.3rem",
                fontWeight: 300,
                letterSpacing: "0.18em",
                color: "#F0EDE8",
                textTransform: "uppercase",
              }}
            >
              Roomly
            </span>
          </div>

          <Link
            href="/"
            className="text-md flex items-center gap-1.5 transition-opacity hover:opacity-75"
            style={{ color: "#C9A96E" }}
          >
            Já tenho conta
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* ── Page header ── */}
        <div className="s-fade mx-auto max-w-2xl px-6 pb-4 pt-12 text-center">
          <p
            className="mb-2 text-[0.65rem] uppercase tracking-[0.3em]"
            style={{ color: "#C9A96E" }}
          >
            Novo cadastro
          </p>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "2.6rem",
              fontWeight: 300,
              color: "#F0EDE8",
              letterSpacing: "0.04em",
              lineHeight: 1.15,
            }}
          >
            Cadastre seu estabelecimento
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: "#6B6560" }}
          >
            Preencha as informações abaixo para criar sua conta no Roomly
          </p>
        </div>

        {/* ── Sections ── */}
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-2xl px-6 pb-20"
        >
          <div className="s-fade-1 mt-10">
            <OwnerSection
              data={owner}
              errors={errors}
              onChange={handleOwnerChange}
            />
          </div>

          <div className="s-fade-2 mt-5">
            <HotelSection
              data={hotel}
              errors={errors}
              onChange={handleHotelChange}
            />
          </div>

          <div className="s-fade-3 mt-5">
            <LogoSection
              preview={logoPreview}
              file={logoFile}
              onSelect={handleLogoSelect}
            />
          </div>

          <div className="s-fade-4 mt-5">
            <SummarySection
              owner={owner}
              hotel={hotel}
              logoFile={logoFile}
              logoPreview={logoPreview}
              isLoading={isLoading}
            />
          </div>
        </form>

        <p
          className="pb-8 text-center text-[0.6rem] uppercase tracking-[0.2em]"
          style={{ color: "rgba(107,101,96,0.25)" }}
        >
          © 2025 Roomly
        </p>
      </div>
    </>
  );
}
