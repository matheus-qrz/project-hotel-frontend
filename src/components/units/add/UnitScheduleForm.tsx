"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import { useRestaurantUnitFormStore } from "@/stores";

const weekDays = [
  { id: "dom", label: "D", fullName: "Domingo" },
  { id: "seg", label: "S", fullName: "Segunda" },
  { id: "ter", label: "T", fullName: "Terça" },
  { id: "qua", label: "Q", fullName: "Quarta" },
  { id: "qui", label: "Q", fullName: "Quinta" },
  { id: "sex", label: "S", fullName: "Sexta" },
  { id: "sab", label: "S", fullName: "Sábado" },
];

export default function UnitScheduleForm() {
  const { unitData, updateUnitData } = useRestaurantUnitFormStore();
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [openTime, setOpenTime] = useState("--:--");
  const [closeTime, setCloseTime] = useState("--:--");
  const toast = useToast();

  const handleToggleMatrixSchedule = (checked: boolean) => {
    updateUnitData({ useMatrixSchedule: checked });
  };

  const handleToggleDay = (dayId: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId],
    );
  };

  const handleAddSchedule = () => {
    if (selectedDays.length > 0) {
      const newSchedule = {
        days: selectedDays,
        opens: openTime,
        closes: closeTime,
      };

      updateUnitData({ schedules: [...unitData.schedules, newSchedule] });
      setSelectedDays([]);
      setOpenTime("--:--");
      setCloseTime("--:--");
    }
  };

  const handleDeleteSchedule = (index: number) => {
    const newSchedules = [...unitData.schedules];
    newSchedules.splice(index, 1);
    updateUnitData({ schedules: newSchedules });
  };

  return (
    <div className="p-0 sm:p-2">
      <div className="mb-5 flex items-center justify-between px-1">
        <h1 className="text-lg font-semibold sm:text-xl">
          Horário de funcionamento
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Coluna esquerda */}
        <div>
          <div className="mb-4">
            <p className="text-sm text-gray-500">
              Informe os horários de funcionamento para que os clientes saibam
              quando acessar sua loja.
            </p>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <Checkbox
              checked={unitData.useMatrixSchedule}
              onCheckedChange={handleToggleMatrixSchedule}
            />
            <Label className="text-sm">Utilizar horários da matriz</Label>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Abre</Label>
              <Input
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Fecha</Label>
              <Input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          {/* Dias da semana – permite wrap no mobile */}
          <div className="mb-4 flex flex-wrap gap-2">
            {weekDays.map((day) => (
              <button
                key={day.id}
                onClick={() => handleToggleDay(day.id)}
                className={[
                  "h-10 w-10 rounded-lg text-sm",
                  "flex items-center justify-center",
                  selectedDays.includes(day.id)
                    ? "bg-gray-100 text-gray-900"
                    : "border border-gray-200 bg-white text-gray-600",
                ].join(" ")}
              >
                {day.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={handleAddSchedule}
            className="w-full border-dashed"
            disabled={selectedDays.length === 0}
          >
            Adicionar horário
          </Button>
        </div>

        {/* Coluna direita */}
        <div className="space-y-4">
          {unitData.schedules.map((schedule, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex flex-wrap gap-1">
                  {schedule.days.map((dayId) => {
                    const day = weekDays.find((d) => d.id === dayId);
                    return (
                      day && (
                        <span
                          key={dayId}
                          className="rounded-full bg-gray-100 px-2.5 py-1 text-xs sm:text-sm"
                        >
                          {day.fullName}
                        </span>
                      )
                    );
                  })}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteSchedule(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p>Abre às:</p>
                  <p className="font-medium text-gray-900">{schedule.opens}</p>
                </div>
                <div>
                  <p>Fecha às:</p>
                  <p className="font-medium text-gray-900">{schedule.closes}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
