"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Settings, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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

  if (isLoading) {
    return <DelayedLoading />;
  }

  return (
    <div
      className={`flex w-full flex-col p-3 ${selectedUnits.length > 0 ? "border-b border-border" : ""}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="default"
          className="cursor-pointer border border-border bg-secondary font-medium text-primary hover:bg-primary hover:text-secondary"
          onClick={handleRegisterRestaurantUnit}
        >
          <Label className="cursor-pointer">Criar nova unidade</Label>
          <Plus className="ml-2" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-sm border border-border hover:bg-primary hover:text-secondary"
        >
          <Settings size={22} />
        </Button>
      </div>

      {/* Filtro */}
      <div className="mt-2 flex items-center gap-4">
        <div className="relative w-full">
          <Input
            type="text"
            placeholder="Buscar por nome, gerente ou CNPJ"
            className="h-10 w-full rounded-sm border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-sm border border-border hover:bg-primary hover:text-secondary"
          title="Mais filtros"
        >
          <Settings2 />
        </Button>
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-4 pt-9">
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
