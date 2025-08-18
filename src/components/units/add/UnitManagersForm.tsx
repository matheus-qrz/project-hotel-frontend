"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/useToast";
import { useAuthStore, useRestaurantUnitFormStore } from "@/stores";
import { useEmployeeStore } from "@/stores/employees";
import { useSession } from "next-auth/react";

interface Manager {
  id: string;
  name: string;
}

interface iUnitManagersForm {
  restaurantId: string;
}

export default function UnitManagersForm({ restaurantId }: iUnitManagersForm) {
  const { unitData, updateUnitData } = useRestaurantUnitFormStore();
  const { employees, fetchEmployees, isLoading } = useEmployeeStore();
  const [availableManagers, setAvailableManagers] = useState<Manager[]>([]);
  const toast = useToast();
  const { data: session, status } = useSession();
  const token = (session as any)?.token as string | undefined;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obter o token de autenticação
        if (!token) {
          throw new Error("Token não encontrado");
        }

        if (!restaurantId || !token) {
          throw new Error("Informações de autenticação insuficientes");
        }

        await fetchEmployees(restaurantId, token);
      } catch (error) {
        console.error("Erro ao carregar gerentes:", error);
        toast.toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar a lista de gerentes",
        });
      }
    };

    fetchData();
  }, [token, restaurantId]);

  useEffect(() => {
    const managers = employees
      .filter((emp) => emp.role === "MANAGER")
      .map((manager) => ({
        id: manager._id,
        name: `${manager.firstName} ${manager.lastName}`,
      }));

    setAvailableManagers(managers);
    console.log("Gerentes disponíveis:", managers); // Debug
  }, [employees]);

  const handleToggleManager = (managerId: string) => {
    const newSelectedManagers = [...unitData.managers];
    const index = newSelectedManagers.findIndex(
      (manager) => manager.id === managerId,
    );

    if (index === -1) {
      const managerToAdd = availableManagers.find(
        (manager) => manager.id === managerId,
      );
      if (managerToAdd) {
        newSelectedManagers.push(managerToAdd);
      }
    } else {
      newSelectedManagers.splice(index, 1);
    }

    updateUnitData({ managers: newSelectedManagers });
  };

  if (isLoading) {
    return <div className="py-8 text-center">Carregando gerentes...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-lg font-medium">Responsáveis da unidade</h2>
        <p className="mb-4 text-sm text-gray-500">
          Selecione os usuários que irão gerenciar a unidade. Esses usuários
          poderão ser editados posteriormente.
        </p>
      </div>

      <div className="space-y-2">
        {availableManagers.length === 0 ? (
          <div className="py-4 text-center text-gray-500">
            Nenhum gerente disponível. Cadastre gerentes antes de continuar.
          </div>
        ) : (
          availableManagers.map((manager) => (
            <div
              key={manager.id}
              className="flex items-center gap-3 rounded-md border border-border p-4"
            >
              <Checkbox
                id={`manager-${manager.id}`}
                checked={unitData.managers.some((m) => m.id === manager.id)}
                onCheckedChange={() => handleToggleManager(manager.id)}
              />
              <Label
                htmlFor={`manager-${manager.id}`}
                className="flex-1 cursor-pointer font-normal"
              >
                {manager.name}
              </Label>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
