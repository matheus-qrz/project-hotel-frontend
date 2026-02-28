"use client";

// components/register/OwnerSection.tsx

import { useState } from "react";
import { User, Mail, Lock, Phone, CreditCard, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RegisterField, SectionShell } from "./RegisterField";
import {
  OwnerForm,
  RegisterErrors,
  INPUT_STYLE,
  formatCPF,
  formatPhone,
} from "./register";

interface OwnerSectionProps {
  data: OwnerForm;
  errors: RegisterErrors;
  onChange: (field: keyof OwnerForm, value: string) => void;
}

export function OwnerSection({ data, errors, onChange }: OwnerSectionProps) {
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);

  const cls = (hasIcon = true, err?: string) =>
    `focus-visible:ring-[#C9A96E] ${hasIcon ? "pl-9" : ""} ${err ? "border-red-500/50" : ""}`;

  return (
    <SectionShell
      icon={User}
      step="Seção 01"
      title="Dados do Responsável"
      subtitle="Informações do proprietário ou responsável legal"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RegisterField
          id="firstName"
          label="Nome"
          icon={User}
          error={errors.firstName}
        >
          <Input
            id="firstName"
            placeholder="João"
            value={data.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
            className={cls(true, errors.firstName)}
            style={INPUT_STYLE}
          />
        </RegisterField>

        <RegisterField
          id="lastName"
          label="Sobrenome"
          error={errors.lastName}
        >
          <Input
            id="lastName"
            placeholder="Silva"
            value={data.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            className={cls(false, errors.lastName)}
            style={{ ...INPUT_STYLE, paddingLeft: "0.75rem" }}
          />
        </RegisterField>

        <RegisterField
          id="cpf"
          label="CPF"
          icon={CreditCard}
          error={errors.cpf}
        >
          <Input
            id="cpf"
            placeholder="000.000.000-00"
            value={data.cpf}
            onChange={(e) => onChange("cpf", formatCPF(e.target.value))}
            className={cls(true, errors.cpf)}
            style={INPUT_STYLE}
          />
        </RegisterField>

        <RegisterField
          id="ownerPhone"
          label="Telefone"
          icon={Phone}
        >
          <Input
            id="ownerPhone"
            placeholder="(00) 00000-0000"
            value={data.phone}
            onChange={(e) => onChange("phone", formatPhone(e.target.value))}
            className={cls(true)}
            style={INPUT_STYLE}
          />
        </RegisterField>

        <div className="sm:col-span-2">
          <RegisterField
            id="ownerEmail"
            label="E-mail"
            icon={Mail}
            error={errors.email}
          >
            <Input
              id="ownerEmail"
              type="email"
              placeholder="joao@email.com"
              value={data.email}
              onChange={(e) => onChange("email", e.target.value)}
              className={cls(true, errors.email)}
              style={INPUT_STYLE}
            />
          </RegisterField>
        </div>

        <RegisterField
          id="password"
          label="Senha"
          icon={Lock}
          error={errors.password}
        >
          <Input
            id="password"
            type={showPass ? "text" : "password"}
            placeholder="Mínimo 6 caracteres"
            value={data.password}
            onChange={(e) => onChange("password", e.target.value)}
            className={`${cls(true, errors.password)} pr-10`}
            style={INPUT_STYLE}
          />
          <button
            type="button"
            onClick={() => setShowPass((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "#6B6560" }}
          >
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </RegisterField>

        <RegisterField
          id="confirmPassword"
          label="Confirmar Senha"
          icon={Lock}
          error={errors.confirmPassword}
        >
          <Input
            id="confirmPassword"
            type={showConf ? "text" : "password"}
            placeholder="Repita a senha"
            value={data.confirmPassword}
            onChange={(e) => onChange("confirmPassword", e.target.value)}
            className={`${cls(true, errors.confirmPassword)} pr-10`}
            style={INPUT_STYLE}
          />
          <button
            type="button"
            onClick={() => setShowConf((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "#6B6560" }}
          >
            {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </RegisterField>
      </div>
    </SectionShell>
  );
}
