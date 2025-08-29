"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Settings, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UnitCard from "./UnitCard";

import {
  RestaurantUnit,
  useRestaurantUnitStore,
} from "@/stores/restaurantUnit/restaurantUnitStore";
import { useToast } from "@/hooks/useToast";
import { DelayedLoading } from "../loading/DelayedLoading";

interface UnitsListProps {
  units: RestaurantUnit[];
  isLoading: boolean;
  restaurantId: string;
}

export default function UnitsList({
  units = [],
  isLoading,
  restaurantId,
}: UnitsListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { deleteUnit } = useRestaurantUnitStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const normalized = (s?: string) => (s ?? "").toLowerCase();
  const filteredUnits = Array.isArray(units)
    ? units.filter(
        (u) =>
          normalized(u.name).includes(normalized(searchTerm)) ||
          normalized(u.manager).includes(normalized(searchTerm)) ||
          (u.cnpj ?? "").includes(searchTerm),
      )
    : [];

  const toggleSelectAll = () => {
    const next = !selectAll;
    setSelectAll(next);
    if (next) setSelectedUnits(filteredUnits.map((u) => u._id));
  };

  const handleUnitToggle = (unitId: string, checked: boolean) => {
    setSelectedUnits((prev) =>
      checked ? [...prev, unitId] : prev.filter((id) => id !== unitId),
    );
  };

  const handleRegisterRestaurantUnit = () => {
    router.push(`/admin/restaurant/${restaurantId}/units/register`);
  };

  const handleDelete = async (unitId: string) => {
    try {
      await deleteUnit(unitId, restaurantId);
      setSelectedUnits((prev) => prev.filter((x) => x !== unitId));
      toast({
        title: "Unidade excluída",
        description: "A unidade foi removida com sucesso.",
      });
    } catch (e: any) {
      toast({
        title: "Erro ao excluir",
        description: e?.message ?? "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return <DelayedLoading />;

  return (
    <div
      className={`flex w-full flex-col p-3 sm:p-4 ${
        selectedUnits.length > 0 ? "border-b border-border" : ""
      }`}
    >
      {/* Ações do topo */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          variant="default"
          className="h-10 w-full cursor-pointer border border-border bg-secondary font-medium text-primary hover:bg-primary hover:text-secondary sm:w-auto"
          onClick={handleRegisterRestaurantUnit}
        >
          <span className="pointer-events-none">Criar nova unidade</span>
          <Plus className="ml-2 shrink-0" />
        </Button>

        <div className="flex sm:ml-auto">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-full rounded-sm border border-border hover:bg-primary hover:text-secondary sm:w-10"
            aria-label="Configurações"
          >
            <Settings size={22} />
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          type="text"
          placeholder="Buscar por nome, gerente ou CNPJ"
          className="h-10 w-full rounded-sm border-border"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-full rounded-sm border border-border hover:bg-primary hover:text-secondary sm:w-10"
          title="Mais filtros"
          aria-label="Mais filtros"
        >
          <Settings2 />
        </Button>
      </div>

      {/* Lista */}
      <div className="space-y-4 pt-6 sm:pt-8">
        {filteredUnits.map((unit) => (
          <UnitCard
            key={unit._id}
            _id={unit._id}
            name={unit.name}
            manager={unit.manager}
            cnpj={unit.cnpj}
            status={unit.status}
            isTopSeller={unit.isTopSeller}
            isMatrix={unit.isMatrix}
            isSelected={selectedUnits.includes(unit._id)}
            selectAll={selectAll}
            onToggleSelection={(checked) => handleUnitToggle(unit._id, checked)}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
