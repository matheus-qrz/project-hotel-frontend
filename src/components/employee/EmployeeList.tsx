"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  PlusCircle,
  Edit,
  Trash2,
  Search,
  UserCircle,
  ArrowUpDown,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { formatFullName } from "@/utils/formatFullname";
import { formatDate } from "@/utils/formatDate";
import { useEmployeeStore, IEmployee } from "@/stores/employees";
import { formatRole } from "@/utils/formatRole";
import { extractIdFromSlug } from "@/utils/slugify";
import { useAuthStore } from "@/stores";
import { useSession } from "next-auth/react";
import { DelayedLoading } from "../loading/DelayedLoading";

export default function EmployeeList() {
  const router = useRouter();
  const { slug } = useParams();
  const { toast } = useToast();

  const { token, setToken } = useAuthStore();
  const { data: session, status } = useSession();
  const sessionToken = (session as any)?.token as string | undefined;

  const { employees, isLoading, error, fetchEmployees, deleteEmployee } =
    useEmployeeStore();

  const [filteredEmployees, setFilteredEmployees] = useState(employees);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<IEmployee | null>(
    null,
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const restaurantId = extractIdFromSlug(String(slug));

  useEffect(() => {
    if (status === "authenticated") {
      if (sessionToken && token !== sessionToken) setToken(sessionToken);
    }
  }, [status, sessionToken, token, setToken]);

  useEffect(() => {
    if (status === "unauthenticated") return;
    if (!restaurantId || !sessionToken) return;

    fetchEmployees(restaurantId, sessionToken).catch(() => {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os funcionários.",
        variant: "destructive",
      });
    });
  }, [restaurantId, status, sessionToken]);

  useEffect(() => {
    const query = searchQuery.toLowerCase();

    const filtered = employees.filter((employee: IEmployee) => {
      const role = (employee.role || "").toUpperCase();

      const matchesSearch =
        (employee.firstName || "").toLowerCase().includes(query) ||
        (employee.lastName || "").toLowerCase().includes(query) ||
        (employee.email || "").toLowerCase().includes(query) ||
        formatRole(role).toLowerCase().includes(query);

      const matchesRole = selectedRole === "ALL" || role === selectedRole;

      return matchesSearch && matchesRole;
    });

    setFilteredEmployees(filtered);
  }, [searchQuery, employees, selectedRole]);

  useEffect(() => {
    return () => {
      setSearchQuery("");
      setSelectedRole("ALL");
    };
  }, []);

  const handleRefresh = async () => {
    if (sessionToken) {
      await fetchEmployees(restaurantId, sessionToken);
      toast({
        title: "Atualizado",
        description: "Lista de funcionários atualizada.",
      });
    }
  };

  const sortedEmployees = [...filteredEmployees]
    .filter((emp) => emp && emp.firstName)
    .sort((a, b) =>
      sortOrder === "asc"
        ? a.firstName.localeCompare(b.firstName)
        : b.firstName.localeCompare(a.firstName),
    );

  const confirmDelete = (employee: IEmployee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!employeeToDelete) return;

    setDeleteDialogOpen(false);

    try {
      await deleteEmployee(employeeToDelete._id, sessionToken ?? "");

      toast({
        title: "Sucesso",
        description: `Funcionário ${formatFullName(employeeToDelete.firstName, employeeToDelete.lastName)} excluído com sucesso.`,
      });

      await fetchEmployees(restaurantId, sessionToken ?? "");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o funcionário.",
        variant: "destructive",
      });
    } finally {
      setEmployeeToDelete(null);
    }
  };

  const goToEdit = (employeeId: string) => {
    router.push(
      `/admin/restaurant/${restaurantId}/employees/${employeeId}/edit`,
    );
  };

  const goToCreate = () => {
    router.push(`/admin/restaurant/${restaurantId}/employees/create`);
  };

  const renderRoleBadge = (role: string) => {
    let variant = "default";

    switch (role) {
      case "ADMIN":
        variant = "destructive";
        break;
      case "MANAGER":
        variant = "purple";
        break;
      case "ATTENDANT":
        variant = "blue";
        break;
      default:
        variant = "secondary";
    }

    return <Badge variant={variant as any}>{formatRole(role)}</Badge>;
  };

  if (isLoading) {
    return <DelayedLoading />;
  }

  if (error) {
    return (
      <Card className="border-red-100 bg-red-50">
        <CardContent className="p-6 text-center">
          <p className="mb-4 text-red-600">{error}</p>
          <Button onClick={() => fetchEmployees}>Tentar Novamente</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-10 px-3">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex w-full flex-row items-center justify-between">
          <Button
            onClick={goToCreate}
            className="flex items-center gap-2"
          >
            <PlusCircle size={18} />
            <span>Novo Funcionário</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="flex items-center gap-2"
            title="Recarregar lista"
          >
            <RefreshCcw size={18} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400"
            size={18}
          />
          <Input
            type="text"
            placeholder="Buscar funcionário por nome, email ou função..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            disabled={employees.length === 0}
          />
        </div>

        <Select
          value={selectedRole}
          onValueChange={setSelectedRole}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas as funções</SelectItem>
            <SelectItem value="ADMIN">Administrador</SelectItem>
            <SelectItem value="MANAGER">Gerente</SelectItem>
            <SelectItem value="ATTENDANT">Atendente</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          disabled={employees.length === 0}
          title={sortOrder === "asc" ? "Ordenar Z-A" : "Ordenar A-Z"}
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>

      {employees.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <UserCircle
              size={48}
              className="mx-auto mb-4 text-gray-300"
            />
            <h3 className="mb-2 text-lg font-medium">
              Não há funcionários cadastrados na rede.
            </h3>
            <p className="mb-4 text-gray-500">
              {searchQuery
                ? "Não há funcionários correspondentes à sua busca."
                : "Não há funcionários cadastrados para esta unidade."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-md border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Cadastrado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEmployees.map((employee) => (
                <TableRow key={employee._id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/restaurant/${restaurantId}/employees/${employee._id}`}
                      className="hover:underline"
                    >
                      {formatFullName(employee.firstName, employee.lastName)}
                    </Link>
                  </TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{renderRoleBadge(employee.role)}</TableCell>
                  <TableCell>{formatDate(employee.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => goToEdit(employee._id)}
                        title="Editar"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => confirmDelete(employee)}
                        className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir o funcionário{" "}
              <strong>
                {employeeToDelete
                  ? formatFullName(
                      employeeToDelete.firstName,
                      employeeToDelete.lastName,
                    )
                  : ""}
              </strong>
              ? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-row justify-between gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Excluir Funcionário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
