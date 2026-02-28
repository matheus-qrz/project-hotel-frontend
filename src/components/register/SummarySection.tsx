"use client";

// components/register/SummarySection.tsx

import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionShell } from "./RegisterField";
import { OwnerForm, HotelForm, HOTEL_TYPES } from "./register";

interface SummarySectionProps {
  owner: OwnerForm;
  hotel: HotelForm;
  logoFile: File | null;
  logoPreview: string | null;
  isLoading: boolean;
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div
      className="flex items-center justify-between py-2"
      style={{ borderBottom: "1px solid rgba(201,169,110,0.08)" }}
    >
      <span
        className="text-[0.72rem] uppercase tracking-[0.1em]"
        style={{ color: "#6B6560" }}
      >
        {label}
      </span>
      <span
        className="max-w-[60%] text-right text-[0.82rem]"
        style={{ color: "#F0EDE8" }}
      >
        {value}
      </span>
    </div>
  );
}

export function SummarySection({
  owner,
  hotel,
  logoFile,
  logoPreview,
  isLoading,
}: SummarySectionProps) {
  const hotelTypeLabel =
    HOTEL_TYPES.find((t) => t.value === hotel.type)?.label ?? "";
  const cityState = [hotel.city, hotel.state].filter(Boolean).join(" — ");

  return (
    <SectionShell
      icon={CheckCircle2}
      step="Seção 04"
      title="Confirmação e Resumo"
      subtitle="Revise as informações antes de finalizar"
    >
      <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        <div>
          <p
            className="mb-2 text-[0.62rem] uppercase tracking-[0.25em]"
            style={{ color: "#C9A96E" }}
          >
            Responsável
          </p>
          <SummaryRow
            label="Nome"
            value={`${owner.firstName} ${owner.lastName}`.trim()}
          />
          <SummaryRow
            label="CPF"
            value={owner.cpf}
          />
          <SummaryRow
            label="E-mail"
            value={owner.email}
          />
          <SummaryRow
            label="Tel."
            value={owner.phone}
          />
        </div>
        <div className="mt-6 sm:mt-0">
          <p
            className="mb-2 text-[0.62rem] uppercase tracking-[0.25em]"
            style={{ color: "#C9A96E" }}
          >
            Estabelecimento
          </p>
          <SummaryRow
            label="Nome"
            value={hotel.name}
          />
          <SummaryRow
            label="Tipo"
            value={hotelTypeLabel}
          />
          <SummaryRow
            label="CNPJ"
            value={hotel.cnpj}
          />
          <SummaryRow
            label="Cidade"
            value={cityState}
          />
        </div>
      </div>

      {logoPreview && (
        <div className="mt-5 flex items-center gap-3">
          <img
            src={logoPreview}
            alt="Logo"
            className="h-10 w-10 rounded-full object-cover"
            style={{ border: "1px solid rgba(201,169,110,0.3)" }}
          />
          <p
            className="text-[0.75rem]"
            style={{ color: "#6B6560" }}
          >
            {logoFile?.name}
          </p>
        </div>
      )}

      <p
        className="mt-6 text-[0.72rem] leading-relaxed"
        style={{ color: "#6B6560" }}
      >
        Ao finalizar, você concorda com os{" "}
        <Link
          href="/termos"
          style={{ color: "#C9A96E", textDecoration: "underline" }}
        >
          Termos de Uso
        </Link>{" "}
        e a{" "}
        <Link
          href="/privacidade"
          style={{ color: "#C9A96E", textDecoration: "underline" }}
        >
          Política de Privacidade
        </Link>{" "}
        do Servinn.
      </p>

      <Button
        type="submit"
        disabled={isLoading}
        className="mt-6 h-12 w-full text-[0.75rem] font-medium uppercase tracking-[0.22em] transition-opacity hover:opacity-90"
        style={{ background: "#C9A96E", color: "#0D0D0D" }}
      >
        {isLoading ? (
          <>
            <Loader2
              size={15}
              className="animate-spin"
            />{" "}
            Criando conta...
          </>
        ) : (
          "Criar conta agora"
        )}
      </Button>
    </SectionShell>
  );
}
