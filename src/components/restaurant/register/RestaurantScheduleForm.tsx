"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/useMobile";
import { useRestaurantFormStore } from "@/stores";

const weekDays = [
    { id: "dom", label: "D", fullName: "Domingo" },
    { id: "seg", label: "S", fullName: "Segunda" },
    { id: "ter", label: "T", fullName: "Terça" },
    { id: "qua", label: "Q", fullName: "Quarta" },
    { id: "qui", label: "Q", fullName: "Quinta" },
    { id: "sex", label: "S", fullName: "Sexta" },
    { id: "sab", label: "S", fullName: "Sábado" },
];

export default function RestaurantScheduleForm() {
    const { formData, updateFormData } = useRestaurantFormStore();
    const isMobile = useIsMobile();
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [openTime, setOpenTime] = useState("--:--");
    const [closeTime, setCloseTime] = useState("--:--");

    const handleToggleDay = (dayId: string) => {
        setSelectedDays(prev =>
            prev.includes(dayId)
                ? prev.filter(d => d !== dayId)
                : [...prev, dayId]
        );
    };

    const handleAddSchedule = () => {
        if (selectedDays.length > 0) {
            const newSchedules = [
                ...formData.schedules,
                {
                    days: [...selectedDays],
                    opens: openTime,
                    closes: closeTime
                }
            ];

            updateFormData({ schedules: newSchedules });
            setSelectedDays([]);
            setOpenTime("--:--");
            setCloseTime("--:--");
        }
    };

    const handleDeleteSchedule = (index: number) => {
        const newSchedules = [...formData.schedules];
        newSchedules.splice(index, 1);
        updateFormData({ schedules: newSchedules });
    };

    return (
        <div className="space-y-6 w-full">
            <div>
                <h2 className="text-lg font-medium mb-1">Horários de funcionamento</h2>
                <p className="text-sm text-gray-500 mb-4">Informe os horários de funcionamento para que os clientes saibam quando acessar sua loja.</p>
            </div>

            <div className="flex space-x-4 mb-4">
                <div className="flex flex-col w-1/2">
                    <Label className="block mb-2">Abre</Label>
                    <Input
                        type="time"
                        value={openTime}
                        onChange={(e) => setOpenTime(e.target.value)}
                        className="w-full"
                    />
                </div>
                <div className="flex flex-col w-1/2">
                    <Label className="block mb-2">Fecha</Label>
                    <Input
                        type="time"
                        value={closeTime}
                        onChange={(e) => setCloseTime(e.target.value)}
                        className="w-full"
                    />
                </div>
            </div>

            <div className="flex gap-2 mb-4">
                {weekDays.map(day => (
                    <Button
                        key={day.id}
                        onClick={() => handleToggleDay(day.id)}
                        className={`w-10 h-10 rounded-md border flex items-center justify-center text-md text-secondary font-semibold
                            ${selectedDays.includes(day.id) ? 'bg-primary' : 'bg-white border-gray-300 text-primary'}`}
                    >
                        {day.label}
                    </Button>
                ))}
            </div>

            <Button
                type="button"
                variant="outline"
                onClick={handleAddSchedule}
                className="w-full py-2 border-dashed text-gray-500"
                disabled={selectedDays.length === 0 || openTime === "--:--" || closeTime === "--:--"}
            >
                Adicionar horário
            </Button>

            {/* Lista de horários configurados */}
            <div className="space-y-4">
                {formData.schedules.map((schedule, index) => (
                    <div key={index} className="border rounded-md p-4 flex justify-between items-center">
                        <div>
                            <div className="flex gap-1 mb-2">
                                {schedule.days.map(dayId => {
                                    const day = weekDays.find(d => d.id === dayId);
                                    return day ? (
                                        <span key={day.id} className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">
                                            {day.fullName}
                                        </span>
                                    ) : null;
                                })}
                            </div>
                            <div className="text-xs text-gray-500">Abre às: {schedule.opens} - Fecha às: {schedule.closes}</div>
                        </div>
                        <Button
                            type="button"
                            onClick={() => handleDeleteSchedule(index)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}