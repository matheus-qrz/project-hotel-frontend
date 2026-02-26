"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// Componentes de formulário
import AdminInfoForm from "@/components/users/admin/AdminInfoForm";
import HotelInfoForm from "./HotelInfoForm";
import HotelAddressForm from "./HotelAddressForm";
import AdminCredentialsForm from "@/components/users/admin/AdminCredentialsForm";
import { useAuthStore, useHotelFormStore } from "@/stores";

export default function MobileHotelRegisterContainer() {
  const router = useRouter();
  const { registerAdminWithHotel } = useAuthStore();
  const { formData, setFormStep, resetForm } = useHotelFormStore();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validação específica para cada passo
  const validateCurrentStep = (): boolean => {
    setError(null);

    switch (step) {
      case 1: // Responsável (Admin)
        if (!formData.admin.firstName) {
          setError("Nome do responsável é obrigatório");
          return false;
        }
        if (!formData.admin.lastName) {
          setError("Sobrenome do responsável é obrigatório");
          return false;
        }
        if (
          !formData.admin.cpf ||
          formData.admin.cpf.replace(/\D/g, "").length < 11
        ) {
          setError("CPF inválido");
          return false;
        }
        return true;

      case 2: // Informações do hotel
        if (!formData.hotel.name) {
          setError("Nome do hotel é obrigatório");
          return false;
        }
        if (formData.hotel.contact.phone) {
          const digits = formData.hotel.contact.phone.replace(/\D/g, "");
          if (digits.length !== 10 && digits.length !== 11) {
            setError("Número de telefone inválido");
            return false;
          }
        }
        return true;

      case 3: // Endereço
        if (
          !formData.hotel.address.zipCode ||
          formData.hotel.address.zipCode.replace(/\D/g, "").length < 8
        ) {
          setError("CEP inválido");
          return false;
        }
        if (!formData.hotel.address.street) {
          setError("Nome da rua é obrigatório");
          return false;
        }
        return true;

      case 4: // Credenciais de acesso
        if (
          !formData.admin.email ||
          !/\S+@\S+\.\S+/.test(formData.admin.email)
        ) {
          setError("Email inválido");
          return false;
        }
        if (!formData.admin.password || formData.admin.password.length < 6) {
          setError("A senha deve ter pelo menos 6 caracteres");
          return false;
        }
        if (formData.admin.password !== formData.admin.confirmPassword) {
          setError("As senhas não conferem");
          return false;
        }
        return true;
    }

    return true;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        // Dados do admin
        firstName: formData.admin.firstName,
        lastName: formData.admin.lastName,
        cpf: formData.admin.cpf.replace(/\D/g, ""),
        phone: formData.admin.phone.replace(/\D/g, ""),
        email: formData.admin.email,
        password: formData.admin.password,

        // Dados do hotel
        name: formData.hotel.name,
        description: formData.hotel.description,
        logo: formData.hotel.logo,
        address: {
          street: formData.hotel.address.street,
          number: formData.hotel.address.number,
          complement: formData.hotel.address.complement || "",
          city: formData.hotel.address.city,
          state: formData.hotel.address.state,
          zipCode: formData.hotel.address.zipCode.replace(/\D/g, ""),
        },
        contact: {
          phone: formData.hotel.contact.phone.replace(/\D/g, ""),
          email: formData.hotel.contact.email || formData.admin.email,
        },
      };

      const result = await registerAdminWithHotel(payload);

      if (result.success) {
        resetForm();

        const hotelId = result.hotel?._id;
        if (hotelId) {
          router.push(`/admin/hotel/${hotelId}/dashboard`);
        } else {
          setError("Cadastro feito, mas ID do hotel não encontrado.");
        }
      } else {
        setError(result.message || "Erro ao registrar");
      }
    } catch (error: any) {
      console.error("Erro ao registrar:", error);
      setError(
        error.message ||
          "Ocorreu um erro ao criar sua conta. Tente novamente mais tarde.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar o formulário atual — 4 passos (sem schedules)
  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return <AdminInfoForm />;
      case 2:
        return <HotelInfoForm />;
      case 3:
        return <HotelAddressForm />;
      case 4:
        return <AdminCredentialsForm />;
      default:
        return null;
    }
  };

  const renderMobileNavigationButtons = () => {
    return (
      <div className="mt-6 flex justify-between">
        {step === 1 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="text-gray-500"
          >
            Cancelar
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={prevStep}
            className="flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            Voltar
          </Button>
        )}

        <Button
          size="sm"
          onClick={step === 4 ? handleSubmit : nextStep}
          disabled={isLoading}
        >
          {isLoading ? "Processando..." : step === 4 ? "Finalizar" : "Próximo"}
        </Button>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Cabeçalho com logo */}
      <div className="flex items-center justify-center bg-black p-4">
        <Image
          src="/Logo.svg"
          alt="Seu Garçom"
          width={120}
          height={40}
          priority
        />
      </div>

      {/* Corpo do formulário */}
      <div className="flex-1 p-4">
        <h1 className="mb-4 text-xl font-bold">Cadastre seu hotel</h1>

        {/* Indicador de progresso — 4 passos */}
        <div className="mb-6 flex justify-between">
          {[1, 2, 3, 4].map((num) => (
            <div
              key={num}
              className={`h-2 w-2 rounded-full ${
                num <= step ? "bg-black" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Formulário atual */}
        {renderCurrentStep()}

        {/* Mensagem de erro */}
        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

        {/* Botões de navegação */}
        {renderMobileNavigationButtons()}
      </div>
    </div>
  );
}
