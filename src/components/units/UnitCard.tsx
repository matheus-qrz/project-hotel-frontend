'use client'

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";

export type UnitStatus = "active" | "outOfHours" | "inactive";

export interface UnitCardProps {
  _id: string;
  name: string;
  manager: string;
  cnpj: string;
  status: UnitStatus;
  isMatrix?: boolean;
  isTopSeller?: boolean;
  isSelected: boolean;
  selectAll: boolean;
  onToggleSelection: (checked: boolean) => void;
}

export default function UnitCard({
  _id,
  name,
  manager,
  cnpj,
  status,
  isTopSeller = false,
  isSelected,
  selectAll,
  onToggleSelection
}: UnitCardProps) {
  const router = useRouter();
  const { slug } = useParams();
  const [selected, setSelected] = useState(isSelected);

  useEffect(() => {
    if (selectAll && !selected) {
      setSelected(true);
      onToggleSelection(true);
    }
  }, [selectAll]);

  useEffect(() => {
    setSelected(isSelected);
  }, [isSelected]);

  const handleSelectionChange = () => {
    const newSelected = !selected;
    setSelected(newSelected);
    onToggleSelection(newSelected);
  };

  const handleViewDetails = () => {
    router.push(`/admin/restaurant/${slug}/units/${_id}`);
  };

  return (
    <div className="border border-border rounded-lg shadow-sm bg-background hover:bg-accent/50 transition-colors">
      <div className="p-4">
        <div className="flex flex-col">
          {isTopSeller && (
            <div className="flex items-center gap-1.5 text-amber-500 text-sm mb-2">
              <Flame size={16} />
              <span>Número #1 em vendas no mês</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-primary">{name}</h3>
            <Checkbox checked={selected} onCheckedChange={handleSelectionChange} />
          </div>
          <div className="mt-6 py-2">
            <div className="border border-b border-gray-200" />
          </div>
          <div className="flex mt-2 justify-between">
            <div className="flex gap-x-32">
              <div>
                <p className="text-sm text-muted-foreground">Gerente responsável</p>
                <p className="text-sm text-primary">{manager}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CNPJ</p>
                <p className="text-sm text-primary">{cnpj}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="ghost"
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-2"
                onClick={handleViewDetails}
              >
                Ver detalhes
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}