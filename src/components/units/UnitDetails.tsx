"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Store,
  MapPin,
  Activity,
  Crown,
  Star,
  UserCog,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";
import { useSession } from "next-auth/react";
import { useRestaurantUnitStore } from "@/stores"; // ajuste o caminho se necessário

interface UnitDetailsProps {
  unitId: string;
}

type UnitStatus = "active" | "outOfHours" | "inactive";

type BusinessDay = { enabled: boolean; open: string; close: string };
type BusinessHours = {
  monday: BusinessDay;
  tuesday: BusinessDay;
  wednesday: BusinessDay;
  thursday: BusinessDay;
  friday: BusinessDay;
  saturday: BusinessDay;
  sunday: BusinessDay;
};

interface StaffLite {
  _id: string;
  fullName?: string;
  name?: string;
  email?: string;
}

interface IUnit {
  _id: string;
  name: string;
  cnpj: string;
  status: UnitStatus;
  isMatrix?: boolean;
  isTopSeller?: boolean;
  address?: {
    zipCode?: string;
    street?: string;
    number?: number | string;
    complement?: string;
  };
  businessHours?: Partial<BusinessHours>;
  managers?: StaffLite[];
  attendants?: StaffLite[];
  createdAt?: string | Date;
}

function formatStatus(s: UnitStatus) {
  return s === "active"
    ? "Ativa"
    : s === "outOfHours"
      ? "Fora do horário"
      : "Inativa";
}

const defaultHours: BusinessHours = {
  monday: { enabled: true, open: "09:00", close: "18:00" },
  tuesday: { enabled: true, open: "09:00", close: "18:00" },
  wednesday: { enabled: true, open: "09:00", close: "18:00" },
  thursday: { enabled: true, open: "09:00", close: "18:00" },
  friday: { enabled: true, open: "09:00", close: "18:00" },
  saturday: { enabled: false, open: "09:00", close: "13:00" },
  sunday: { enabled: false, open: "09:00", close: "13:00" },
};

export default function UnitDetails({ unitId }: UnitDetailsProps) {
  const router = useRouter();
  const { slug } = useParams();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const token = (session as any)?.token as string | undefined;

  const { fetchUnitById, updateUnit } = useRestaurantUnitStore();

  const [unit, setUnit] = useState<IUnit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<{
    cnpj: string;
    status: UnitStatus | "";
    isMatrix: "true" | "false";
    isTopSeller: "true" | "false";
    businessHours: BusinessHours;
  }>({
    cnpj: "",
    status: "",
    isMatrix: "false",
    isTopSeller: "false",
    businessHours: defaultHours,
  });

  if (!token || status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  useEffect(() => {
    let isMounted = true;
    const fetchUnit = async () => {
      try {
        setIsLoading(true);
        const data = (await fetchUnitById(
          unitId,
          String(token),
        )) as IUnit | null;
        if (!data) throw new Error("Unidade não encontrada");
        if (isMounted) {
          setUnit(data);
          const hours = data.businessHours
            ? { ...defaultHours, ...data.businessHours }
            : defaultHours;
          setFormData({
            cnpj: data.cnpj || "",
            status: (data.status as UnitStatus) || "active",
            isMatrix: data.isMatrix ? "true" : "false",
            isTopSeller: data.isTopSeller ? "true" : "false",
            businessHours: hours,
          });
        }
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error?.message || "Falha ao carregar unidade",
          variant: "destructive",
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    if (status === "authenticated") fetchUnit();
    return () => {
      isMounted = false;
    };
  }, [unitId, token, status]);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    if (unit)
      setFormData({
        cnpj: unit.cnpj || "",
        status: unit.status,
        isMatrix: unit.isMatrix ? "true" : "false",
        isTopSeller: unit.isTopSeller ? "true" : "false",
        businessHours: unit.businessHours
          ? { ...defaultHours, ...unit.businessHours }
          : defaultHours,
      });
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      await updateUnit(unitId, {
        cnpj: formData.cnpj,
        status: formData.status as UnitStatus,
        isMatrix: formData.isMatrix === "true",
        isTopSeller: formData.isTopSeller === "true",
        businessHours: formData.businessHours,
      } as any);
      toast({
        title: "Sucesso",
        description: "Unidade atualizada com sucesso!",
      });
      setIsEditing(false);
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err?.message || "Erro ao atualizar unidade",
        variant: "destructive",
      });
    }
  };

  const goBack = () => router.push(`/admin/restaurant/${slug}/units`);

  const dayOrder = [
    { key: "monday", label: "Segunda" },
    { key: "tuesday", label: "Terça" },
    { key: "wednesday", label: "Quarta" },
    { key: "thursday", label: "Quinta" },
    { key: "friday", label: "Sexta" },
    { key: "saturday", label: "Sábado" },
    { key: "sunday", label: "Domingo" },
  ] as const;

  const managers = (unit?.managers ?? []).map((m) => ({
    ...m,
    role: "MANAGER" as const,
  }));
  const attendants = (unit?.attendants ?? []).map((a) => ({
    ...a,
    role: "ATTENDANT" as const,
  }));
  const staff = [...managers, ...attendants];

  if (isLoading || !unit) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
        >
          <ArrowLeft />
        </Button>
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          className="mr-2"
        >
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-bold text-primary">Detalhes da Unidade</h1>
      </div>

      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="mb-1 flex items-center gap-2 text-xl font-bold">
                <Store
                  size={18}
                  className="text-primary"
                />{" "}
                {unit.name}
                {unit.isMatrix && (
                  <Badge className="rounded-full bg-purple-500 px-3 py-1.5 text-sm">
                    Matriz
                  </Badge>
                )}
                {unit.isTopSeller && (
                  <Badge className="rounded-full bg-amber-500 px-3 py-1.5 text-sm">
                    Destaque
                  </Badge>
                )}
              </h2>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    (unit.status === "active"
                      ? "bg-green-500"
                      : unit.status === "outOfHours"
                        ? "bg-amber-500"
                        : "bg-red-500") + " rounded-full px-3 py-1.5 text-sm"
                  }
                >
                  {formatStatus(unit.status)}
                </Badge>
              </div>
            </div>
            {!isEditing && (
              <Button
                onClick={handleEdit}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Edit size={16} />
                <span>Editar</span>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-12 p-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin
                  size={16}
                  className="text-primary"
                />
                <span>CNPJ</span>
              </p>
              {isEditing ? (
                <Input
                  value={formData.cnpj}
                  onChange={(e) =>
                    setFormData({ ...formData, cnpj: e.target.value })
                  }
                />
              ) : (
                <p className="font-medium">{unit.cnpj}</p>
              )}
            </div>

            <div className="space-y-1">
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <Activity
                  size={16}
                  className="text-primary"
                />
                <span>Status</span>
              </p>
              {isEditing ? (
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as UnitStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="outOfHours">Fora do horário</SelectItem>
                    <SelectItem value="inactive">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="font-medium">{formatStatus(unit.status)}</p>
              )}
            </div>

            <div className="space-y-1">
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <Crown
                  size={16}
                  className="text-primary"
                />
                <span>Matriz</span>
              </p>
              {isEditing ? (
                <Select
                  value={formData.isMatrix}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      isMatrix: value as "true" | "false",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Sim</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="font-medium">{unit.isMatrix ? "Sim" : "Não"}</p>
              )}
            </div>

            <div className="space-y-1">
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <Star
                  size={16}
                  className="text-primary"
                />
                <span>Destaque</span>
              </p>
              {isEditing ? (
                <Select
                  value={formData.isTopSeller}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      isTopSeller: value as "true" | "false",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Sim</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="font-medium">
                  {unit.isTopSeller ? "Sim" : "Não"}
                </p>
              )}
            </div>
          </div>

          {/* Bloco com 2 colunas: horário (esquerda) e funcionários (direita) */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Horário */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">
                Horário de funcionamento
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {dayOrder.map(({ key, label }) => (
                  <div
                    key={key}
                    className="grid grid-cols-1 gap-3 md:grid-cols-5 md:items-center"
                  >
                    <span className="text-sm text-gray-500 md:col-span-1">
                      {label}
                    </span>
                    {isEditing ? (
                      <>
                        <div className="flex gap-2 md:col-span-2">
                          <Input
                            type="time"
                            value={formData.businessHours[key].open}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                businessHours: {
                                  ...prev.businessHours,
                                  [key]: {
                                    ...prev.businessHours[key],
                                    open: e.target.value,
                                  },
                                },
                              }))
                            }
                            disabled={!formData.businessHours[key].enabled}
                          />
                          <Input
                            type="time"
                            value={formData.businessHours[key].close}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                businessHours: {
                                  ...prev.businessHours,
                                  [key]: {
                                    ...prev.businessHours[key],
                                    close: e.target.value,
                                  },
                                },
                              }))
                            }
                            disabled={!formData.businessHours[key].enabled}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Select
                            value={String(formData.businessHours[key].enabled)}
                            onValueChange={(v) =>
                              setFormData((prev) => ({
                                ...prev,
                                businessHours: {
                                  ...prev.businessHours,
                                  [key]: {
                                    ...prev.businessHours[key],
                                    enabled: v === "true",
                                  },
                                },
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Aberto</SelectItem>
                              <SelectItem value="false">Fechado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm font-medium md:col-span-4">
                        {formData.businessHours[key].enabled ? (
                          `${formData.businessHours[key].open} - ${formData.businessHours[key].close}`
                        ) : (
                          <span className="text-gray-400">Fechado</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Funcionários */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Funcionários</h3>
              <div className="max-h-80 overflow-y-auto pr-2">
                {staff.length ? (
                  <ul className="divide-y">
                    {staff.map((e: any) => (
                      <li
                        key={e._id ?? e.id ?? e.email}
                        className="flex items-center justify-between gap-3 py-3"
                      >
                        <div className="flex items-center gap-3">
                          {e.role === "MANAGER" ? (
                            <UserCog className="h-5 w-5 text-primary" />
                          ) : (
                            <User className="h-5 w-5 text-primary" />
                          )}
                          <div>
                            <p className="font-medium leading-tight">
                              {e.fullName || e.name || e.email || e._id}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {e.email ||
                                (e.role === "MANAGER"
                                  ? "Gerente"
                                  : "Atendente")}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={
                            (e.role === "MANAGER"
                              ? "bg-purple-500"
                              : "bg-blue-500") +
                            " rounded-full px-2 py-0.5 text-xs"
                          }
                        >
                          {e.role === "MANAGER" ? "MANAGER" : "ATTENDANT"}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Não há funcionários cadastrados nesta unidade.
                  </p>
                )}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
