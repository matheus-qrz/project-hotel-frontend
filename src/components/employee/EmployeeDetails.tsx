'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Mail, Phone, Calendar, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/useToast';
import {
    getEmployeeById,
    formatRole,
} from '@/services/employee/index';
import { IEmployee } from '@/services/employee/types';
import { useAuthCheck } from '@/hooks/sessionManager';

interface EmployeeDetailsProps {
    unitId: string;
    employeeId: string;
}

export default function EmployeeDetails({ unitId, employeeId }: EmployeeDetailsProps) {
    const router = useRouter();
    const { slug } = useParams();
    const { toast } = useToast();
    const { isAuthenticated, isAdminOrManager, session } = useAuthCheck();
    const [employee, setEmployee] = useState<IEmployee | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Buscar dados do funcionário
    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                setIsLoading(true);
                const data = await getEmployeeById(employeeId, session?.token ?? '');
                setEmployee(data);
            } catch (error: any) {
                console.error('Erro ao buscar funcionário:', error);
                setError(error.message || 'Não foi possível carregar os dados do funcionário.');
                toast({
                    title: "Erro",
                    description: "Falha ao carregar dados do funcionário.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchEmployee();
    }, [employeeId, toast]);

    // Voltar para a lista
    const goBack = () => {
        router.push(`/admin/restaurant/${slug}/employees`);
    };

    // Ir para edição
    const goToEdit = () => {
        router.push(`/admin/restaurant/${slug}/employees/${employeeId}/edit`);
    };

    // Renderizar skeleton durante carregamento
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goBack}
                        className="mr-2"
                    >
                        <ArrowLeft />
                    </Button>
                    <Skeleton className="h-8 w-64" />
                </div>

                <Card>
                    <CardContent className="p-6">
                        <div className="animate-pulse space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-40" />
                                    <Skeleton className="h-4 w-60" />
                                </div>
                                <Skeleton className="h-10 w-24" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-6 w-40" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-6 w-40" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-6 w-40" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-6 w-40" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Renderizar mensagem de erro
    if (error || !employee) {
        return (
            <div className="space-y-6">
                <Button
                    variant="ghost"
                    onClick={goBack}
                    className="flex items-center gap-2 mb-6"
                >
                    <ArrowLeft size={18} />
                    <span>Voltar para lista</span>
                </Button>

                <Card className="bg-red-50 border-red-100">
                    <CardContent className="p-6 text-center">
                        <p className="text-red-600 mb-4">{error || 'Funcionário não encontrado'}</p>
                        <Button onClick={goBack}>Voltar para a lista de funcionários</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Renderizar dados do funcionário
    return (
        <div className="space-y-6">
            <div className="flex items-center mb-6">
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

            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-xl font-bold mb-1">
                                {`${employee.firstName} ${employee.lastName}`}
                            </h2>
                            <Badge className={employee.role === 'ADMIN' ? 'bg-red-500' : employee.role === 'MANAGER' ? 'bg-purple-500' : 'bg-blue-500'}>
                                {formatRole(employee.role)}
                            </Badge>
                        </div>

                        <Button
                            onClick={goToEdit}
                            className="flex items-center gap-2"
                            variant="outline"
                        >
                            <Edit size={16} />
                            <span>Editar</span>
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                <Mail size={16} className="text-primary" />
                                <span>Email</span>
                            </p>
                            <p className="font-medium">{employee.email}</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                <Phone size={16} className="text-primary" />
                                <span>Telefone</span>
                            </p>
                            <p className="font-medium">
                                {employee.phone || <span className="text-gray-400">Não informado</span>}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                <Calendar size={16} className="text-primary" />
                                <span>Cadastrado em</span>
                            </p>
                            <p className="font-medium">{(employee.createdAt)}</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                <Shield size={16} className="text-primary" />
                                <span>Função</span>
                            </p>
                            <p className="font-medium">{formatRole(employee.role)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};