// Novo componente EmployeeDetails com edição inline
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Mail, Phone, Calendar, Shield } from "lucide-react";
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
import { useAuthStore } from "@/stores";
import { useToast } from "@/hooks/useToast";
import { useEmployeeStore, IEmployee, Role } from "@/stores/employees";
import { formatDate } from "@/utils/formatDate";
import { formatRole } from "@/utils/formatRole";
import { useSession } from "next-auth/react";

interface EmployeeDetailsProps {
  unitId: string;
  employeeId: string;
}

export default function EmployeeDetails({
  unitId,
  employeeId,
}: EmployeeDetailsProps) {
  const router = useRouter();
  const { slug } = useParams();
  const { toast } = useToast();
  const { fetchEmployeeById, updateEmployee } = useEmployeeStore();

  const [employee, setEmployee] = useState<IEmployee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ email: "", phone: "", role: "" });

  const { data: session, status } = useSession();
  const token = (session as any)?.token as string | undefined;

  if (!token || status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  useEffect(() => {
    let isMounted = true;

    const fetchEmployee = async () => {
      try {
        setIsLoading(true);
        const data = await fetchEmployeeById(employeeId, String(token));
        if (!data) throw new Error("Funcionário não encontrado");
        if (isMounted) {
          setEmployee(data);
          setFormData({
            email: data.email,
            phone: data.phone || "",
            role: data.role,
          });
        }
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error.message || "Falha ao carregar funcionário",
          variant: "destructive",
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (status === "authenticated") fetchEmployee();

    return () => {
      isMounted = false;
    };
  }, [employeeId, token, status]);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    if (employee)
      setFormData({
        email: employee.email,
        phone: employee.phone || "",
        role: employee.role,
      });
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      await updateEmployee(
        employeeId,
        { ...formData, role: formData.role as Role },
        String(token),
      );
      toast({
        title: "Sucesso",
        description: "Funcionário atualizado com sucesso!",
      });
      setIsEditing(false);
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao atualizar funcionário",
        variant: "destructive",
      });
    }
  };

  const goBack = () => router.push(`/admin/restaurant/${slug}/employees`);

  if (isLoading || !employee) {
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
        <h1 className="text-2xl font-bold text-primary">
          Detalhes do Funcionário
        </h1>
      </div>

      <Card className="max-w-4xl">
        <CardContent className="space-y-6 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="mb-1 text-xl font-bold">
                {employee.firstName} {employee.lastName}
              </h2>
              <Badge
                className={
                  employee.role === "ADMIN"
                    ? "bg-red-500"
                    : employee.role === "MANAGER"
                      ? "bg-purple-500"
                      : "bg-blue-500"
                }
              >
                {formatRole(employee.role)}
              </Badge>
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
                <Mail
                  size={16}
                  className="text-primary"
                />
                <span>Email</span>
              </p>
              {isEditing ? (
                <Input
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              ) : (
                <p className="font-medium">{employee.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <Phone
                  size={16}
                  className="text-primary"
                />
                <span>Telefone</span>
              </p>
              {isEditing ? (
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              ) : (
                <p className="font-medium">
                  {employee.phone || (
                    <span className="text-gray-400">Não informado</span>
                  )}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar
                  size={16}
                  className="text-primary"
                />
                <span>Cadastrado em</span>
              </p>
              <p className="font-medium">{formatDate(employee.createdAt)}</p>
            </div>

            <div className="space-y-1">
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <Shield
                  size={16}
                  className="text-primary"
                />
                <span>Função</span>
              </p>
              {isEditing ? (
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="MANAGER">Gerente</SelectItem>
                    <SelectItem value="ATTENDANT">Atendente</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="font-medium">{formatRole(employee.role)}</p>
              )}
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
