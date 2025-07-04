"use client";

import { Plus, Settings, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { Label } from "../ui/label";
import UnitCard from "./UnitCard";
import { useState } from "react";
import { RestaurantUnit } from "@/stores/restaurantUnit/restaurantUnitStore";

interface UnitsListProps {
  units: RestaurantUnit[];
  isLoading: boolean;
  restaurantId: string;
}

export default function UnitsList({ units = [], isLoading, restaurantId }: UnitsListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const filteredUnits = Array.isArray(units) ? units.filter(unit =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.cnpj.includes(searchTerm)
  ) : [];

  const toggleSelectAll = () => {
    const newSelectAllState = !selectAll;
    setSelectAll(newSelectAllState);

    if (newSelectAllState) {
      setSelectedUnits(filteredUnits.map(unit => unit._id));
    }
  };

  const handleUnitToggle = (unitId: string, checked: boolean) => {
    if (checked) {
      setSelectedUnits(prev => [...prev, unitId]);
    } else {
      setSelectedUnits(prev => prev.filter(id => id !== unitId));
    }
  };

  const handleRegisterRestaurantUnit = () => {
    router.push(`/admin/restaurant/${restaurantId}/units/register`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col p-3 ${selectedUnits.length > 0 ? 'border-b border-border' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="default"
          className="font-medium cursor-pointer bg-secondary text-primary border border-border hover:bg-primary hover:text-secondary"
          onClick={handleRegisterRestaurantUnit}
        >
          <Label className="cursor-pointer">Criar nova unidade</Label>
          <Plus className="ml-2" />
        </Button>
        <Button variant="outline" size="icon" className="rounded-sm h-10 w-10 border border-border hover:bg-primary hover:text-secondary">
          <Settings size={22} />
        </Button>
      </div>

      <div className="flex flex-row justify-center items-center mt-6 gap-4">
        <div className="w-full relative space-y-2">
          <Input
            type="text"
            placeholder="Placeholder"
            className="w-full h-10 border-border rounded-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="ghost" size="icon" className="rounded-sm h-10 w-10 border border-border hover:bg-primary hover:text-secondary">
          <Settings2 />
        </Button>
      </div>

      <div className="flex flex-row w-full justify-end items-center gap-4 py-4">
        <label htmlFor="select-all" className="text-sm text-primary">
          Selecionar todas
        </label>
        <Checkbox
          id="select-all"
          checked={selectAll}
          onCheckedChange={toggleSelectAll}
          className="h-5 w-5 rounded-none data-[state=checked]:bg-primary data-[state=checked]:border-border border-border"
        />
      </div>

      <div className="space-y-4">
        {filteredUnits.map(unit => (
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
          />
        ))}
      </div>
    </div>
  );
}