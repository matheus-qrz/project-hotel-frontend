"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Flame, Pencil, Trash2, Eye } from "lucide-react";
import { formatCnpj } from "@/utils/formatCnpj";

export type UnitStatus = "active" | "outOfHours" | "inactive";

export interface UnitCardProps {
  _id: string;
  name: string;
  manager?: string;
  cnpj?: string;
  status: UnitStatus;
  isMatrix?: boolean;
  isTopSeller?: boolean;
  isSelected: boolean;
  selectAll: boolean;
  onToggleSelection: (checked: boolean) => void;
  onDelete?: (id: string) => Promise<void> | void;
}

export default function UnitCard({
  _id,
  name,
  manager,
  cnpj,
  status,
  isMatrix = false,
  isTopSeller = false,
  isSelected,
  selectAll,
  onToggleSelection,
  onDelete,
}: UnitCardProps) {
  const router = useRouter();
  const { slug } = useParams();
  const [selected, setSelected] = useState(isSelected);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (selectAll && !selected) {
      setSelected(true);
      onToggleSelection(true);
    }
  }, [selectAll]); // eslint-disable-line

  useEffect(() => {
    setSelected(isSelected);
  }, [isSelected]);

  const goDetails = () => router.push(`/admin/restaurant/${slug}/units/${_id}`);
  const goEdit = () => router.push(`/admin/restaurant/${slug}/units/${_id}`); // edição na tela de detalhes

  const statusDot =
    {
      active: "bg-green-500",
      outOfHours: "bg-amber-500",
      inactive: "bg-red-500",
    }[status] ?? "bg-zinc-400";

  return (
    <div className="bg-card/60 hover:bg-accent/40 group rounded-lg border border-border transition-colors">
      {/* Cabeçalho do card: empilha no mobile, linha no desktop */}
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Bloco de textos */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${statusDot}`} />
            <h3 className="truncate text-base font-medium text-foreground sm:text-lg">
              {name}
            </h3>

            {isMatrix && (
              <Badge className="rounded-full px-2 py-0.5 text-[10px] sm:text-xs">
                Matriz
              </Badge>
            )}
            {isTopSeller && (
              <Badge className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-xs">
                <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Destaque
              </Badge>
            )}
          </div>

          <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="font-medium">Gerente:</span>
              <span className="truncate text-foreground">
                {manager && manager.trim() ? manager : "Sem gerente"}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <span className="font-medium">CNPJ:</span>
              <span className="truncate text-foreground">
                {formatCnpj(String(cnpj)) || "—"}
              </span>
            </span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex shrink-0 items-center gap-1 sm:self-start">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goDetails}
            title="Ver detalhes"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goEdit}
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700"
            onClick={() => setConfirmOpen(true)}
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir unidade?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta ação não poderá ser desfeita.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (onDelete) await onDelete(_id);
                setConfirmOpen(false);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
