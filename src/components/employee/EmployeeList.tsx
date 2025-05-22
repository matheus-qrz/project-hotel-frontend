'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusCircle, Edit, Trash2, Search, UserCircle, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { formatFullName } from '@/utils/formatFullname';
import { formatDate } from '@/utils/formatDate';
import {
    getEmployeesByRestaurant,
    deleteEmployee,
    formatRole,
} from '@/services/employee/index';
import { IEmployee } from '@/services/employee/types';
import { useAuthCheck } from '@/hooks/sessionManager';

interface EmployeeListProps {
    restaurantId: string;
}

export default function EmployeeList({ restaurantId }: EmployeeListProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { isAuthenticated, isAdminOrManager, session } = useAuthCheck();
    const [employees, setEmployees] = useState<IEmployee[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<IEmployee[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<IEmployee | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const fetchEmployees = async () => {
        try {
            setIsLoading(true);
            setError(null);

            if (isAuthenticated && isAdminOrManager) {
                const data = await getEmployeesByRestaurant(restaurantId, session?.token ?? '');
                setEmployees(Array.isArray(data) ? data : []);
                setFilteredEmployees(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            toast({
                title: "Erro",
                description: "Não foi possível carregar os funcionários. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, [restaurantId]);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredEmployees(employees);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = employees.filter(employee =>
                employee.firstName.toLowerCase().includes(query) ||
                employee.lastName.toLowerCase().includes(query) ||
                employee.email.toLowerCase().includes(query) ||
                formatRole(employee.role).toLowerCase().includes(query)
            );
            setFilteredEmployees(filtered);
        }
    }, [searchQuery, employees]);

    const sortedEmployees = [...filteredEmployees].sort((a, b) => {
        return sortOrder === 'asc'
            ? a.firstName.localeCompare(b.firstName)
            : b.firstName.localeCompare(a.firstName);
    });

    const confirmDelete = (employee: IEmployee) => {
        setEmployeeToDelete(employee);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!employeeToDelete) return;

        try {
            await deleteEmployee(employeeToDelete._id, session?.token ?? '');

            toast({
                title: "Sucesso",
                description: `Funcionário ${formatFullName(employeeToDelete.firstName, employeeToDelete.lastName)} excluído com sucesso.`,
            });

            fetchEmployees();
        } catch (error: any) {
            toast({
                title: "Erro",
                description: error.message || "Não foi possível excluir o funcionário. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setDeleteDialogOpen(false);
            setEmployeeToDelete(null);
        }
    };

    const goToEdit = (employeeId: string) => {
        router.push(`/restaurant/${restaurantId}/employees/${employeeId}/edit`);
    };

    const goToCreate = () => {
        router.push(`/restaurant/${restaurantId}/employees/create`);
    };

    const renderRoleBadge = (role: string) => {
        let variant = 'default';

        switch (role) {
            case 'ADMIN':
                variant = 'destructive';
                break;
            case 'MANAGER':
                variant = 'purple';
                break;
            case 'ATTENDANT':
                variant = 'blue';
                break;
            default:
                variant = 'secondary';
        }

        return (
            <Badge variant={variant as any}>{formatRole(role)}</Badge>
        );
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>

                <div className="h-10 bg-gray-200 rounded w-full animate-pulse mb-4"></div>

                <div className="border rounded-md">
                    <div className="h-12 border-b bg-gray-100 animate-pulse"></div>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-16 border-b bg-gray-50 animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="bg-red-50 border-red-100">
                <CardContent className="p-6 text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={fetchEmployees}>Tentar Novamente</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-primary">Funcionários</h2>
                <Button onClick={goToCreate} className="flex items-center gap-2">
                    <PlusCircle size={18} />
                    <span>Novo Funcionário</span>
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        type="text"
                        placeholder="Buscar funcionário por nome, email ou função..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        disabled={employees.length === 0}
                    />
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    disabled={employees.length === 0}
                    title={sortOrder === 'asc' ? 'Ordenar Z-A' : 'Ordenar A-Z'}
                >
                    <ArrowUpDown className="h-4 w-4" />
                </Button>
            </div>

            {employees.length === 0 ? (
                <Card>
                    <CardContent className="p-6 text-center">
                        <UserCircle size={48} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium mb-2">Não há funcionários cadastrados na rede.</h3>
                        <p className="text-gray-500 mb-4">
                            {searchQuery
                                ? 'Não há funcionários correspondentes à sua busca.'
                                : 'Não há funcionários cadastrados para esta unidade.'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="bg-white rounded-md border shadow-sm overflow-hidden">
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
                                        <Link href={`/restaurant/${restaurantId}/employees/${employee._id}`} className="hover:underline">
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
                                                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
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

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirmar exclusão</DialogTitle>
                        <DialogDescription>
                            Você tem certeza que deseja excluir o funcionário{" "}
                            <strong>
                                {employeeToDelete
                                    ? formatFullName(employeeToDelete.firstName, employeeToDelete.lastName)
                                    : ""}
                            </strong>
                            ? Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-row justify-between sm:justify-between gap-2 mt-4">
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
