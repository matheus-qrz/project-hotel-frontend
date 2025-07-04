// Implementação para o componente EmployeeDetailsPage

'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import EmployeeDetails from '@/components/employee/EmployeeDetails';
import { useAuthCheck } from '@/hooks/sessionManager';

export default function EmployeeDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const unitId = params.unitId as string;
    const employeeId = params.employeeId as string;

    // Usar o hook de verificação de autenticação
    const { isAuthenticated, isAdmin, isManager, isLoading } = useAuthCheck();

    // Verificar se o usuário está autorizado (admin ou gerente)
    const isAuthorized = isAuthenticated && (isAdmin || isManager);

    // Redirecionar se não estiver autenticado após carregamento
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded w-full mb-6"></div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-20 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardContent className="p-6 text-center">
                        <h2 className="text-xl font-semibold text-red-600 mb-2">Acesso Negado</h2>
                        <p>Você não tem permissão para acessar esta página.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <EmployeeDetails unitId={unitId} employeeId={employeeId} />
        </div>
    );
}