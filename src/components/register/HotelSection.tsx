"use client";

// components/register/HotelSection.tsx

import { Building2, Mail, Phone, FileText, MapPin, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RegisterField, SectionShell } from "./RegisterField";
import {
  HotelForm,
  RegisterErrors,
  INPUT_STYLE,
  HOTEL_TYPES,
  STATES,
  formatCNPJ,
  formatPhone,
  formatCEP,
} from "./register";

interface HotelSectionProps {
  data: HotelForm;
  errors: RegisterErrors;
  onChange: (field: keyof HotelForm, value: string) => void;
}

const SELECT_CONTENT_STYLE: React.CSSProperties = {
  background: "#1A1A1A",
  border: "1px solid rgba(201,169,110,0.2)",
};

export function HotelSection({ data, errors, onChange }: HotelSectionProps) {
  const cls = (hasIcon = true, err?: string) =>
    `focus-visible:ring-[#C9A96E] ${hasIcon ? "pl-9" : ""} ${err ? "border-red-500/50" : ""}`;

  const noIcon = { ...INPUT_STYLE, paddingLeft: "0.75rem" };

  return (
    <SectionShell
      icon={Building2}
      step="Seção 02"
      title="Dados do Estabelecimento"
      subtitle="Informações gerais do seu hotel, pousada ou motel"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <RegisterField
            id="hotelName"
            label="Nome do Estabelecimento"
            icon={Building2}
            error={errors.hotelName}
          >
            <Input
              id="hotelName"
              placeholder="Grand Hotel Tambaú"
              value={data.name}
              onChange={(e) => onChange("name", e.target.value)}
              className={cls(true, errors.hotelName)}
              style={INPUT_STYLE}
            />
          </RegisterField>
        </div>

        {/* Tipo — stored as `description` on backend since IHotel has no `type` field */}
        <div className="flex flex-col gap-1.5">
          <Label
            className="text-[0.68rem] uppercase tracking-[0.12em]"
            style={{ color: errors.hotelType ? "#f87171" : "#6B6560" }}
          >
            Tipo de Estabelecimento
          </Label>
          <Select
            value={data.type}
            onValueChange={(v) => onChange("type", v)}
          >
            <SelectTrigger
              className="h-11 focus:ring-[#C9A96E]"
              style={{
                ...INPUT_STYLE,
                borderColor: errors.hotelType
                  ? "rgba(239,68,68,0.5)"
                  : "rgba(201,169,110,0.2)",
              }}
            >
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent style={SELECT_CONTENT_STYLE}>
              {HOTEL_TYPES.map((t: any) => (
                <SelectItem
                  key={t.value}
                  value={t.value}
                  className="focus:bg-[rgba(201,169,110,0.1)] focus:text-[#F0EDE8]"
                  style={{ color: "#F0EDE8" }}
                >
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.hotelType && (
            <p
              className="text-[0.68rem]"
              style={{ color: "#f87171" }}
            >
              {errors.hotelType}
            </p>
          )}
        </div>

        {/* CNPJ — forward-compat field, not in IHotel yet */}
        <RegisterField
          id="cnpj"
          label="CNPJ"
          icon={FileText}
          error={errors.cnpj}
        >
          <Input
            id="cnpj"
            placeholder="00.000.000/0000-00"
            value={data.cnpj}
            onChange={(e) => onChange("cnpj", formatCNPJ(e.target.value))}
            className={cls(true, errors.cnpj)}
            style={INPUT_STYLE}
          />
        </RegisterField>

        {/* contact.phone — maps to IHotel.contact.phone */}
        <RegisterField
          id="hotelPhone"
          label="Telefone de Contato"
          icon={Phone}
        >
          <Input
            id="hotelPhone"
            placeholder="(00) 0000-0000"
            value={data.phone}
            onChange={(e) => onChange("phone", formatPhone(e.target.value))}
            className={cls(true)}
            style={INPUT_STYLE}
          />
        </RegisterField>

        {/* contact.email — maps to IHotel.contact.email */}
        <RegisterField
          id="hotelEmail"
          label="E-mail de Contato"
          icon={Mail}
        >
          <Input
            id="hotelEmail"
            type="email"
            placeholder="contato@hotel.com"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
            className={cls(true)}
            style={INPUT_STYLE}
          />
        </RegisterField>
      </div>

      {/* ── Address ── */}
      <div className="mb-4 mt-6 flex items-center gap-3">
        <MapPin
          size={13}
          style={{ color: "#C9A96E" }}
        />
        <span
          className="text-[0.65rem] uppercase tracking-[0.25em]"
          style={{ color: "#C9A96E" }}
        >
          Endereço
        </span>
        <span
          className="flex-1"
          style={{ height: "1px", background: "rgba(201,169,110,0.15)" }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
        {/* street — maps to IHotel.address.street */}
        <div className="sm:col-span-4">
          <RegisterField
            id="street"
            label="Logradouro"
            error={errors.street}
          >
            <Input
              id="street"
              placeholder="Rua, Av, Travessa..."
              value={data.street}
              onChange={(e) => onChange("street", e.target.value)}
              className={cls(false, errors.street)}
              style={noIcon}
            />
          </RegisterField>
        </div>

        {/* number — maps to IHotel.address.number */}
        <div className="sm:col-span-2">
          <RegisterField
            id="number"
            label="Número"
            icon={Hash}
            error={errors.number}
          >
            <Input
              id="number"
              placeholder="123"
              value={data.number}
              onChange={(e) => onChange("number", e.target.value)}
              className={cls(true, errors.number)}
              style={INPUT_STYLE}
            />
          </RegisterField>
        </div>

        {/* complement — not in IHotel.address, sent as extra */}
        <div className="sm:col-span-3">
          <RegisterField
            id="complement"
            label="Complemento"
          >
            <Input
              id="complement"
              placeholder="Apto, Sala..."
              value={data.complement}
              onChange={(e) => onChange("complement", e.target.value)}
              className={cls(false)}
              style={noIcon}
            />
          </RegisterField>
        </div>

        {/* neighborhood — not in IHotel.address, sent as extra */}
        <div className="sm:col-span-3">
          <RegisterField
            id="neighborhood"
            label="Bairro"
          >
            <Input
              id="neighborhood"
              placeholder="Centro"
              value={data.neighborhood}
              onChange={(e) => onChange("neighborhood", e.target.value)}
              className={cls(false)}
              style={noIcon}
            />
          </RegisterField>
        </div>

        {/* city — maps to IHotel.address.city */}
        <div className="sm:col-span-3">
          <RegisterField
            id="city"
            label="Cidade"
            error={errors.city}
          >
            <Input
              id="city"
              placeholder="João Pessoa"
              value={data.city}
              onChange={(e) => onChange("city", e.target.value)}
              className={cls(false, errors.city)}
              style={noIcon}
            />
          </RegisterField>
        </div>

        {/* state — maps to IHotel.address.state */}
        <div className="sm:col-span-1">
          <div className="flex flex-col gap-1.5">
            <Label
              className="text-[0.68rem] uppercase tracking-[0.12em]"
              style={{ color: errors.state ? "#f87171" : "#6B6560" }}
            >
              UF
            </Label>
            <Select
              value={data.state}
              onValueChange={(v) => onChange("state", v)}
            >
              <SelectTrigger
                className="h-11 focus:ring-[#C9A96E]"
                style={{
                  ...INPUT_STYLE,
                  borderColor: errors.state
                    ? "rgba(239,68,68,0.5)"
                    : "rgba(201,169,110,0.2)",
                }}
              >
                <SelectValue placeholder="--" />
              </SelectTrigger>
              <SelectContent style={SELECT_CONTENT_STYLE}>
                {STATES.map((s) => (
                  <SelectItem
                    key={s}
                    value={s}
                    className="focus:bg-[rgba(201,169,110,0.1)]"
                    style={{ color: "#F0EDE8" }}
                  >
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.state && (
              <p
                className="text-[0.68rem]"
                style={{ color: "#f87171" }}
              >
                {errors.state}
              </p>
            )}
          </div>
        </div>

        {/* zipCode — maps to IHotel.address.zipCode */}
        <div className="sm:col-span-2">
          <RegisterField
            id="zipCode"
            label="CEP"
            error={errors.zipCode}
          >
            <Input
              id="zipCode"
              placeholder="00000-000"
              value={data.zipCode}
              onChange={(e) => onChange("zipCode", formatCEP(e.target.value))}
              className={cls(false, errors.zipCode)}
              style={noIcon}
            />
          </RegisterField>
        </div>
      </div>
    </SectionShell>
  );
}
