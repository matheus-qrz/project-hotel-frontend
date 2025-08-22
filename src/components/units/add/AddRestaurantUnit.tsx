"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useRestaurantUnitFormStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import UnitInfoForm from "./UnitInfoForm";
import UnitAddressForm from "./UnitAddressForm";
import UnitScheduleForm from "./UnitScheduleForm";
import UnitManagersForm from "./UnitManagersForm";
import UnitSuccessScreen from "./UnitSuccessScreen";
import { useToast } from "@/hooks/useToast";
import useFetchRestaurantInfo from "@/hooks/fetchRestaurantInfo";
import { useSession } from "next-auth/react";

export interface Schedule {
  day: string;
  opens: string;
  closes: string;
}

export interface RestaurantUnit {
  cnpj: string;
  socialName: string;
  name: string;
  phone: string;
  specialty: string;
  useMatrixCNPJ: boolean;
  address: {
    zipCode: string;
    street: string;
    number: string;
    complement: string;
  };
  useMatrixSchedule: boolean;
  managers: string[];
  schedules: Schedule[];
  isMatrix?: boolean;
}

interface iAddRestaurantUnit {
  restaurantId: string;
}

const initialUnit: RestaurantUnit = {
  cnpj: "",
  socialName: "",
  name: "",
  phone: "",
  specialty: "",
  useMatrixCNPJ: false,
  address: {
    zipCode: "",
    street: "",
    number: "",
    complement: "",
  },
  useMatrixSchedule: false,
  schedules: [],
  managers: [],
};

export default function AddRestaurantUnit({
  restaurantId,
}: iAddRestaurantUnit) {
  useFetchRestaurantInfo();
  const { isLoading } = useAuthStore();
  const { unitData, resetForm } = useRestaurantUnitFormStore();
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session, status } = useSession();
  const token = (session as any)?.token as string | undefined;

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
  }, [isLoading, status]);

  const handleNext = () => {
    if (step === 1) {
      // Validar primeiro step
      if (!unitData.name || !unitData.socialName || !unitData.cnpjPart1) {
        toast({
          variant: "destructive",
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios",
        });
        return;
      }
    }

    if (step === 2) {
      // Validar endereço
      if (!unitData.zipCode || !unitData.street || !unitData.number) {
        toast({
          variant: "destructive",
          title: "Endereço incompleto",
          description: "Preencha todos os campos do endereço",
        });
        return;
      }
    }

    if (step === 3) {
      // Validar horários
      if (!unitData.useMatrixSchedule && unitData.schedules.length === 0) {
        toast({
          variant: "destructive",
          title: "Horários não definidos",
          description: "Defina pelo menos um horário de funcionamento",
        });
        return;
      }
    }

    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleClose = () => {
    resetForm();
    router.push(`/admin/restaurant/${restaurantId}/units`);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      if (!restaurantId) {
        throw new Error("ID do restaurante não encontrado");
      }

      if (!token) {
        throw new Error("Token não encontrado");
      }

      const cnpj =
        `${unitData.cnpjPart1}${unitData.cnpjPart2}${unitData.cnpjPart3}`.replace(
          /\D/g,
          "",
        );

      // Formatar os dados conforme esperado pelo backend
      const payload = {
        name: unitData.name,
        socialName: unitData.socialName,
        cnpj: cnpj,
        phone: unitData.phone,
        address: {
          street: unitData.street,
          number: unitData.number,
          complement: unitData.complement || "",
          zipCode: unitData.zipCode,
        },
        businessHours: unitData.schedules.map((schedule) => ({
          days: schedule.days,
          opens: schedule.opens,
          closes: schedule.closes,
        })),
        managers: unitData.managers.map((manager) => manager.id), // Importante: enviar array de IDs
        isMatrix: false,
        status: "active",
      };

      const response = await fetch(
        `/${API_URL}/restaurant/${restaurantId}/units/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Usa o token do authStore
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      resetForm();
      setStep(5); // Avança para tela de sucesso
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar unidade",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // const updateUnitInfo = (data: Partial<RestaurantUnit>) => {
  //     setUnit((prev) => ({ ...prev, ...data }));
  // };

  // const updateUnitAddress = (address: Partial<RestaurantUnit["address"]>) => {
  //     setUnit((prev) => ({
  //         ...prev,
  //         address: { ...prev.address, ...address },
  //     }));
  // };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return <UnitInfoForm />;
      case 2:
        return <UnitAddressForm />;
      case 3:
        return <UnitScheduleForm />;
      case 4:
        return <UnitManagersForm restaurantId={restaurantId} />;
      case 5:
        return <UnitSuccessScreen />;
      default:
        return <UnitInfoForm />;
    }
  };

  return (
    <div className="h-screen">
      <div className="mx-auto flex w-full flex-col bg-transparent">
        <div className="relative mx-auto mb-8 mt-8 w-full p-8">
          <div className="mb-7 flex flex-row items-center justify-between">
            <h2 className="text-2xl font-medium">Adicionar nova unidade</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="mb-8">{renderStepContent()}</div>

          {step !== 5 && (
            <div className="mt-14">
              <Progress
                value={(step / 4) * 100}
                className="mb-6 h-2 bg-gray-300"
              />
              <div className="flex justify-between">
                {step > 1 ? (
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    className="rounded-md border border-border px-4 py-2"
                  >
                    <span>
                      <ChevronLeft className="mr-1 inline h-4 w-4" />
                      Voltar para:
                      {step === 2 && " Informações da unidade"}
                      {step === 3 && " Endereço da unidade"}
                      {step === 4 && " Horário de funcionamento"}
                    </span>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="rounded-md border border-border px-4 py-2"
                  >
                    Cancelar
                  </Button>
                )}

                <Button
                  onClick={step < 4 ? handleNext : handleSubmit}
                  disabled={isSubmitting}
                  className="rounded-md bg-secondary px-4 py-2 text-primary hover:bg-gray-800"
                >
                  {step < 4 ? (
                    <>
                      Próximo
                      <ChevronRight className="ml-2 inline h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 inline h-4 w-4" />
                      Finalizar cadastro
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="mt-8">
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/admin/restaurant/${restaurantId}/units`)
                  }
                  className="w-full"
                >
                  Voltar para o menu inicial
                </Button>
                <Button
                  className="w-full bg-black text-white hover:bg-gray-800"
                  onClick={() =>
                    router.push(`/admin/restaurant/unit/${unitData.id}`)
                  }
                >
                  Visualizar unidade
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
