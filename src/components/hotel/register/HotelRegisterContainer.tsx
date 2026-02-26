// components/HotelRegisterContainer.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useIsMobile } from "@/hooks/useMobile";
import { Button } from "@/components/ui/button";
import { useAuthStore, useHotelFormStore, useHotelStore } from "@/stores";

// Componentes de formulário
import AdminInfoForm from "@/components/users/admin/AdminInfoForm";
import HotelInfoForm from "./HotelInfoForm";
import HotelAddressForm from "./HotelAddressForm";
import AdminCredentialsForm from "@/components/users/admin/AdminCredentialsForm";

export default function HotelRegisterContainer() {
  const router = useRouter();
  const { registerAdminWithHotel } = useAuthStore();
  const isMobile = useIsMobile();

  const { formData, currentStep, setFormStep, resetForm } = useHotelFormStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validação específica para cada passo
  const validateCurrentStep = (): boolean => {
    setError(null);

    switch (currentStep) {
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
        if (!formData.hotel.address.number) {
          setError("Número é obrigatório");
          return false;
        }
        if (!formData.hotel.address.city) {
          setError("Cidade é obrigatória");
          return false;
        }
        if (!formData.hotel.address.state) {
          setError("Estado é obrigatório");
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

  // Avançar ao próximo passo
  const nextStep = () => {
    if (validateCurrentStep()) {
      setFormStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  // Voltar ao passo anterior
  const prevStep = () => {
    setFormStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  // Submeter o formulário completo
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
      console.error("Erro durante o cadastro:", error);
      setError(error.message || "Ocorreu um erro ao criar sua conta.");
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar o formulário atual baseado no passo
  const renderCurrentStep = () => {
    switch (currentStep) {
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

  const getBackButtonLabel = () => {
    switch (currentStep) {
      case 2:
        return isMobile ? "Voltar" : "Voltar para\nResponsável do hotel";
      case 3:
        return isMobile ? "Voltar" : "Voltar para\nInformações do hotel";
      case 4:
        return isMobile ? "Voltar" : "Voltar para\nEndereço do hotel";
      default:
        return "Voltar";
    }
  };

  const renderNavigationButtons = () => {
    return (
      <div className="mt-8 flex justify-between">
        {currentStep === 1 ? (
          <Button
            variant="outline"
            onClick={() => router.push("/login")}
            className="px-5"
          >
            Cancelar
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={prevStep}
            className={`flex items-center text-xs ${isMobile ? "px-3 py-2" : ""}`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2"
            >
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {getBackButtonLabel()}
          </Button>
        )}

        <Button
          onClick={currentStep === 4 ? handleSubmit : nextStep}
          disabled={isLoading}
          className="px-5"
        >
          {isLoading
            ? "Processando..."
            : currentStep === 4
              ? "Finalizar"
              : "Próximo"}
        </Button>
      </div>
    );
  };

  return (
    <div className={`flex min-h-screen ${isMobile ? "flex-col" : "flex-row"}`}>
      {/* Container do formulário */}
      <div
        className={`${isMobile ? "order-2 w-full" : "w-1/3"} flex items-center justify-center bg-white p-4 md:p-8`}
      >
        <div className="w-full max-w-md">
          <h1 className="mb-6 text-2xl font-bold">Cadastre seu hotel</h1>

          {/* Indicador de progresso — 4 passos */}
          <div className="mb-8">
            <div className="flex">
              {[1, 2, 3, 4].map((num) => (
                <div
                  key={num}
                  className="flex-1"
                >
                  <div
                    className={`h-1 ${num <= currentStep ? "bg-black" : "bg-gray-200"}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Formulário atual */}
          {renderCurrentStep()}

          {/* Mensagem de erro */}
          {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

          {/* Botões de navegação */}
          {renderNavigationButtons()}
        </div>
      </div>

      {/* Logo / Imagem lateral */}
      <div
        className={`${isMobile ? "order-1 h-48 w-full" : "h-screen w-2/3"} flex items-center justify-center bg-black`}
      >
        <Image
          src="/Logo.svg"
          alt="Seu Garçom"
          width={isMobile ? 150 : 250}
          height={isMobile ? 60 : 100}
          priority
        />
      </div>
    </div>
  );
}
