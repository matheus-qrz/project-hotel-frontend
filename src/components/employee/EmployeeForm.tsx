import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';
import { useEmployeeStore } from '@/stores/employees';
import { useAuthStore, useRestaurantUnitStore } from '@/stores';

interface EmployeeFormProps {
    restaurantId: string;
    employeeId?: string;
    isEditMode: boolean;
}

export default function EmployeeForm({ restaurantId, employeeId, isEditMode }: EmployeeFormProps) {
    const router = useRouter();
    const { slug } = useParams()
    const { toast } = useToast();
    const { addEmployee, fetchEmployeeById, updateEmployee, units, setUnits } = useEmployeeStore();
    const { fetchUnitByRestaurantId } = useRestaurantUnitStore();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [restaurantName, setRestaurantName] = useState('');
    const { token } = useAuthStore();

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    // Dados do formulário
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: '',
        unitId: ''
    });

    // Erros de validação
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Monta uma lista com as unidades incluindo a matriz
    const getUnitsWithMatrix = () => {
        // Se já temos uma unidade matriz entre as unidades, não precisamos adicionar
        const hasMatrix = units.some(unit => unit.isMatrix === true);

        if (hasMatrix || units.length === 0) {
            // Se não temos unidades ou já temos matriz, retornamos as unidades como estão
            return units;
        } else {
            // Adicionar a matriz como a primeira opção
            return [
                {
                    _id: restaurantId, // Usa o ID do restaurante para a matriz
                    name: `${restaurantName || 'Restaurante'} (MATRIZ)`,
                    isMatrix: true
                },
                ...units
            ];
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (token && restaurantId) {
                try {
                    // Buscar dados do restaurante para obter o nome
                    const restaurantResponse = await fetch(`${API_URL}/restaurant/${restaurantId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (restaurantResponse.ok) {
                        const restaurantData = await restaurantResponse.json();
                        setRestaurantName(restaurantData.name || 'Restaurante');
                    }

                    // Buscar unidades
                    const unitsData = await fetchUnitByRestaurantId(restaurantId);
                    if (unitsData && Array.isArray(unitsData)) {
                        setUnits(unitsData);
                    }

                    // Buscar dados do funcionário se estiver em modo de edição
                    if (isEditMode && employeeId) {
                        const employee = await fetchEmployeeById(employeeId, token || '');
                        employee && setFormData({
                            firstName: employee.firstName,
                            lastName: employee.lastName,
                            email: employee.email,
                            phone: employee.phone || '',
                            password: '',
                            confirmPassword: '',
                            role: employee.role,
                            unitId: employee.restaurantUnit || ''
                        });
                    }
                } catch (error) {
                    console.error('Erro ao carregar dados:', error);
                    toast({
                        title: "Erro",
                        description: "Erro ao carregar dados",
                        variant: "destructive"
                    });
                }
            }
        };

        fetchData();
    }, [restaurantId, employeeId, isEditMode, token]);

    // Atualizar dados do formulário
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Limpar erro de validação quando o usuário digita
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // Atualizar função selecionada
    const handleRoleChange = (value: string) => {
        setFormData(prev => ({ ...prev, role: value }));

        // Limpar erro de validação
        if (validationErrors.role) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.role;
                return newErrors;
            });
        }
    };

    // Atualizar unidade selecionada
    const handleUnitChange = (value: string) => {
        setFormData(prev => ({ ...prev, unitId: value }));
    };

    // Validar formulário
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.firstName.trim()) {
            errors.firstName = 'Nome é obrigatório';
        }

        if (!formData.lastName.trim()) {
            errors.lastName = 'Sobrenome é obrigatório';
        }

        if (!formData.email.trim()) {
            errors.email = 'Email é obrigatório';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Email inválido';
        }

        if (!formData.role) {
            errors.role = 'Função é obrigatória';
        }

        if (!formData.unitId) {
            errors.unitId = 'Unidade é obrigatória';
        }

        // Validação de senha apenas para criação ou se estiver alterando a senha
        if (formData.role === 'ADMIN' || formData.role === 'MANAGER') {
            if (!isEditMode && !formData.password) {
                errors.password = 'Senha é obrigatória';
            } else if (formData.password && formData.password.length < 6) {
                errors.password = 'A senha deve ter pelo menos 6 caracteres';
            }

            if (formData.password !== formData.confirmPassword) {
                errors.confirmPassword = 'As senhas não correspondem';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Enviar formulário
    // Ajuste no handleSubmit para tratar a matriz corretamente
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSaving(true);
        setError(null);

        if (token) {
            try {
                const isMatriz = formData.unitId === restaurantId;

                const employeeData = {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone || undefined,
                    role: formData.role as "ADMIN" | "MANAGER" | "ATTENDANT",
                    password: formData.role === 'ADMIN' || formData.role === 'MANAGER'
                        ? formData.password
                        : undefined,
                    restaurant: restaurantId,
                    restaurantUnit: isMatriz ? '' : formData.unitId
                };


                if (isEditMode && employeeId) {
                    await updateEmployee(
                        employeeId,
                        employeeData,
                        token
                    );

                    toast({
                        title: "Sucesso",
                        description: "Funcionário atualizado com sucesso."
                    });

                    // Ajusta o redirecionamento baseado se é matriz ou unidade
                    const redirectPath = isMatriz
                        ? `/admin/restaurant/${slug}/employees`
                        : `/admin/restaurant/${slug}/units/${formData.unitId}/employees`;

                    router.push(redirectPath);
                } else {
                    await addEmployee(
                        employeeData,
                        restaurantId,
                        token
                    );

                    toast({
                        title: "Sucesso",
                        description: "Funcionário criado com sucesso."
                    });

                    // Ajusta o redirecionamento baseado se é matriz ou unidade
                    const redirectPath = formData.unitId === restaurantId
                        ? `/admin/restaurant/${slug}/employees`
                        : `/admin/restaurant/${slug}/units/${formData.unitId}/employees`;

                    router.push(redirectPath);
                }
            } catch (error) {
                const errorMessage = error instanceof Error
                    ? error.message
                    : 'Ocorreu um erro ao salvar o funcionário.';

                setError(errorMessage);
                toast({
                    title: "Erro",
                    description: errorMessage,
                    variant: "destructive"
                });
            } finally {
                setIsSaving(false);
            }
        }
    };

    // Voltar para a lista
    const goBack = () => {
        router.push(`/admin/restaurant/${slug}/employees`);
    };

    // Obtém a lista completa de unidades com a matriz
    const unitsWithMatrix = getUnitsWithMatrix();

    return (
        <div className="min-h-screen flex flex-col pt-15">
            <div className="w-full max-w-4xl bg-white space-y-10 p-8 rounded-lg shadow-md">
                <div className="flex flex-row sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h1 className="text-2xl font-bold text-primary">
                        {isEditMode ? 'Editar Funcionário' : 'Novo Funcionário'}
                    </h1>
                    <Button
                        variant="ghost"
                        onClick={goBack}
                        className="flex items-center gap-2 pl-0 hover:pl-2"
                    >
                        <ArrowLeft size={18} />
                        <span>Voltar para lista</span>
                    </Button>
                </div>

                {error && (
                    <Card className="bg-red-50 border-red-100 mb-6">
                        <CardContent className="p-4 text-red-800">
                            <p>{error}</p>
                        </CardContent>
                    </Card>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nome */}
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Nome <span className="text-red-500">*</span></Label>
                            <Input
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                placeholder="Nome"
                                className={validationErrors.firstName ? "border-red-500" : ""}
                            />
                            {validationErrors.firstName && (
                                <p className="text-red-500 text-sm">{validationErrors.firstName}</p>
                            )}
                        </div>

                        {/* Sobrenome */}
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Sobrenome <span className="text-red-500">*</span></Label>
                            <Input
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                placeholder="Sobrenome"
                                className={validationErrors.lastName ? "border-red-500" : ""}
                            />
                            {validationErrors.lastName && (
                                <p className="text-red-500 text-sm">{validationErrors.lastName}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Email"
                                className={validationErrors.email ? "border-red-500" : ""}
                            />
                            {validationErrors.email && (
                                <p className="text-red-500 text-sm">{validationErrors.email}</p>
                            )}
                        </div>

                        {/* Telefone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Input
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="(00) 00000-0000"
                            />
                        </div>

                        {/* Função */}
                        <div className="space-y-2">
                            <Label htmlFor="role">Função <span className="text-red-500">*</span></Label>
                            <Select
                                value={formData.role}
                                onValueChange={handleRoleChange}
                            >
                                <SelectTrigger
                                    id="role"
                                    className={validationErrors.role ? "border-red-500" : ""}
                                >
                                    <SelectValue placeholder="Selecione uma função" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="ADMIN">Administrador</SelectItem>
                                        <SelectItem value="MANAGER">Gerente</SelectItem>
                                        <SelectItem value="ATTENDANT">Atendente</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            {validationErrors.role && (
                                <p className="text-red-500 text-sm">{validationErrors.role}</p>
                            )}
                        </div>

                        {/* Unidade */}
                        <div className="space-y-2">
                            <Label htmlFor="unitId">Unidade <span className="text-red-500">*</span></Label>
                            <Select
                                value={formData.unitId}
                                onValueChange={handleUnitChange}
                            >
                                <SelectTrigger
                                    id="unitId"
                                    className={validationErrors.unitId ? "border-red-500" : ""}
                                >
                                    <SelectValue placeholder="Selecione uma unidade" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {unitsWithMatrix.length === 0 ? (
                                            // Se não houver unidades, mostra apenas a matriz
                                            <SelectItem value={restaurantId}>
                                                {`${restaurantName || 'Restaurante'} (MATRIZ)`}
                                            </SelectItem>
                                        ) : (
                                            // Se houver unidades, mostra a lista com a matriz
                                            unitsWithMatrix.map((unit: any) => (
                                                <SelectItem key={unit._id} value={unit._id}>
                                                    {unit.isMatrix ? `${restaurantName || 'Restaurante'} (MATRIZ)` : (unit.name || 'Unidade')}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            {validationErrors.unitId && (
                                <p className="text-red-500 text-sm">{validationErrors.unitId}</p>
                            )}
                        </div>
                    </div>

                    {/* Senha e Confirmação de Senha - Apenas para ADMIN e MANAGER */}
                    {(formData.role === 'ADMIN' || formData.role === 'MANAGER') && (
                        <div className="border-t pt-6 mt-6">
                            <h3 className="text-lg font-medium mb-4">
                                {isEditMode ? 'Alterar Senha (opcional)' : 'Definir Senha'}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="password">
                                        Senha {!isEditMode && <span className="text-red-500">*</span>}
                                    </Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder={isEditMode ? "Deixe em branco para manter a atual" : "Senha"}
                                        className={validationErrors.password ? "border-red-500" : ""}
                                    />
                                    {validationErrors.password && (
                                        <p className="text-red-500 text-sm">{validationErrors.password}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">
                                        Confirmar Senha {!isEditMode && <span className="text-red-500">*</span>}
                                    </Label>
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        placeholder="Confirmar senha"
                                        className={validationErrors.confirmPassword ? "border-red-500" : ""}
                                    />
                                    {validationErrors.confirmPassword && (
                                        <p className="text-red-500 text-sm">{validationErrors.confirmPassword}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Botões */}
                    <div className="flex justify-end gap-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={goBack}
                            disabled={isSaving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Salvando...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>Salvar</span>
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}