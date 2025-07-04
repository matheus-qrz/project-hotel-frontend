// components/RestaurantRegisterContainer.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useIsMobile } from '@/hooks/useMobile';
import { useAuthCheck } from '@/hooks/sessionManager';
import { Button } from '@/components/ui/button';
import { useAuthStore, useRestaurantFormStore, useRestaurantStore } from '@/stores';

// Componentes de formulário
import AdminInfoForm from '@/components/users/admin/AdminInfoForm';
import RestaurantInfoForm from './RestaurantInfoForm';
import RestaurantAddressForm from './RestaurantAddressForm';
import RestaurantScheduleForm from './RestaurantScheduleForm';
import AdminCredentialsForm from '@/components/users/admin/AdminCredentialsForm';

export default function RestaurantRegisterContainer() {
    const router = useRouter();
    const { registerAdminWithRestaurant } = useAuthCheck();
    const isMobile = useIsMobile();

    // Usar Zustand para gerenciar o estado do formulário
    const { formData, currentStep, setFormStep, resetForm } = useRestaurantFormStore();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Validação específica para cada passo
    const validateCurrentStep = (): boolean => {
        setError(null);

        switch (currentStep) {
            case 1: // Responsável (Admin)
                if (!formData.adminName) {
                    setError("Nome do responsável é obrigatório");
                    return false;
                }
                if (!formData.adminCpf || formData.adminCpf.length < 14) {
                    setError("CPF inválido");
                    return false;
                }
                return true;

            case 2: // Informações da loja
                if (!formData.name) {
                    setError("Nome da loja é obrigatório");
                    return false;
                }

                // Validação básica do CNPJ (poderia ser mais elaborada)
                const cnpjPart1 = formData.cnpjPart1.replace(/\D/g, '');
                if (!cnpjPart1 || cnpjPart1.length < 8 || !formData.cnpjPart2 || !formData.cnpjPart3) {
                    setError("CNPJ inválido");
                    return false;
                }
                if (formData.phone) {
                    const digits = formData.phone.replace(/\D/g, '');
                    // Aplicamos a mesma validação que está no componente
                    if (digits.length !== 10 && digits.length !== 11) {
                        setError("Número de telefone inválido");
                        return false;
                    }
                }

                return true;

            case 3: // Endereço
                if (!formData.zipCode || formData.zipCode.length < 9) {
                    setError("CEP inválido");
                    return false;
                }
                if (!formData.street) {
                    setError("Nome da rua é obrigatório");
                    return false;
                }
                if (!formData.number) {
                    setError("Número é obrigatório");
                    return false;
                }
                return true;

            case 4: // Horários de funcionamento
                if (formData.schedules.length === 0) {
                    setError("Adicione pelo menos um horário de funcionamento");
                    return false;
                }
                return true;

            case 5: // Credenciais de acesso
                if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
                    setError("Email inválido");
                    return false;
                }
                if (!formData.password || formData.password.length < 6) {
                    setError("A senha deve ter pelo menos 6 caracteres");
                    return false;
                }
                if (formData.password !== formData.confirmPassword) {
                    setError("As senhas não conferem");
                    return false;
                }
                return true;
        }

        return true;
    };

    const formatPhone = (phone: string) => {
        if (!phone) return "";

        // Remove todos os caracteres não numéricos
        const digits = phone.replace(/\D/g, '');

        // Retorna apenas os dígitos
        return digits;
    };

    // Função para avançar ao próximo passo
    const nextStep = () => {
        if (validateCurrentStep()) {
            setFormStep(currentStep + 1);
            window.scrollTo(0, 0);
        }
    };

    // Função para voltar ao passo anterior
    const prevStep = () => {
        setFormStep(currentStep - 1);
        window.scrollTo(0, 0);
    };

    // Função para submeter o formulário completo
    const handleSubmit = async () => {
        if (!validateCurrentStep()) return;

        setIsLoading(true);
        setError(null);

        try {
            // Preparar os dados para API
            const firstName = formData.adminName.split(' ')[0];
            const lastName = formData.adminName.split(' ').slice(1).join(' ');

            // Montar CNPJ completo
            const cnpj = `${formData.cnpjPart1.replace(/\D/g, '')}${formData.cnpjPart2}${formData.cnpjPart3}`;

            // Transformar os horários para o formato esperado pelo backend
            const businessHours = formData.schedules.map(schedule => {
                // Mapear os IDs de dias para os nomes completos em português
                const dayMappings: Record<string, string> = {
                    dom: 'Domingo',
                    seg: 'Segunda',
                    ter: 'Terça',
                    qua: 'Quarta',
                    qui: 'Quinta',
                    sex: 'Sexta',
                    sab: 'Sábado'
                };

                const days = schedule.days.map(dayId => dayMappings[dayId] || dayId);

                return {
                    days,
                    open: schedule.opens,
                    close: schedule.closes
                };
            });

            // Preparar payload para a API
            const payload = {
                // Dados do admin
                firstName,
                lastName,
                cpf: formData.adminCpf.replace(/\D/g, ''),
                phone: formatPhone(formData.phone),
                email: formData.email,
                password: formData.password,

                // Dados do restaurante
                name: formData.name,
                socialName: formData.socialName || formData.name,
                cnpj: cnpj.replace(/\D/g, ''),
                specialty: formData.specialty,

                // Endereço
                address: {
                    zipCode: formData.zipCode.replace(/\D/g, ''),
                    street: formData.street,
                    number: parseInt(formData.number) || 0,
                    complement: formData.complement || ''
                },

                // Horários
                businessHours
            };

            // Usar o hook de autenticação para registrar
            const result = await registerAdminWithRestaurant(payload);

            if (result.success) {
                // Limpar o formulário após sucesso
                resetForm();

                // Obter o ID do restaurante do useRestaurantStore
                const restaurantId = useRestaurantStore.getState().restaurant?._id;

                if (result.token) {
                    useAuthStore.getState().setToken(result.token);
                    useAuthStore.getState().setUserRole('ADMIN');
                }

                // Redirecionar para o dashboard com o ID do restaurante
                if (restaurantId) {
                    router.push(`/admin/restaurant/${restaurantId}/dashboard`);
                } else {
                    // Fallback para a resposta da API se o store não tiver o ID ainda
                    router.push(`/admin/restaurant/${result.restaurant?._id}/dashboard`);
                }
            } else {
                setError(result.message);
            }
        } catch (error: any) {
            console.error('Erro durante o cadastro:', error);
            setError(error.message || 'Ocorreu um erro ao criar sua conta.');
        } finally {
            setIsLoading(false);
        }
    };

    // Renderizar o formulário atual baseado no passo
    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return <AdminInfoForm />;
            case 2:
                return <RestaurantInfoForm />;
            case 3:
                return <RestaurantAddressForm />;
            case 4:
                return <RestaurantScheduleForm />;
            case 5:
                return <AdminCredentialsForm />;
            default:
                return null;
        }
    };

    // Renderização condicional dos botões de navegação
    const renderNavigationButtons = () => {
        return (
            <div className="mt-8 flex justify-between">
                {currentStep === 1 ? (
                    <Button
                        variant="outline"
                        onClick={() => router.push('/')}
                        className="px-5"
                    >
                        Cancelar
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        onClick={prevStep}
                        className={`flex items-center text-xs ${isMobile ? 'py-2 px-3' : ''}`}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {getBackButtonLabel()}
                    </Button>
                )}

                <Button
                    onClick={currentStep === 5 ? handleSubmit : nextStep}
                    disabled={isLoading}
                    className="px-5"
                >
                    {isLoading ? "Processando..." : currentStep === 5 ? "Finalizar" : "Próximo"}
                </Button>
            </div>
        );
    };

    // Obter o texto apropriado para o botão de voltar
    const getBackButtonLabel = () => {
        switch (currentStep) {
            case 2:
                return isMobile ? "Voltar" : "Voltar para\nResponsável da loja";
            case 3:
                return isMobile ? "Voltar" : "Voltar para\nInformações da loja";
            case 4:
                return isMobile ? "Voltar" : "Voltar para\nEndereço da loja";
            case 5:
                return isMobile ? "Voltar" : "Voltar para\nHorário de funcionamento";
            default:
                return "Voltar";
        }
    };

    // Layout principal
    return (
        <div className={`min-h-screen flex ${isMobile ? 'flex-col' : 'flex-row'}`}>
            {/* Container do formulário */}
            <div className={`${isMobile ? 'w-full order-2' : 'w-1/3'} p-4 md:p-8 flex items-center justify-center bg-white`}>
                <div className="w-full max-w-md">
                    <h1 className="text-2xl font-bold mb-6">Crie sua conta</h1>

                    {/* Indicador de progresso */}
                    <div className="mb-8">
                        <div className="flex">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <div key={num} className="flex-1">
                                    <div className={`h-1 ${num <= currentStep ? 'bg-black' : 'bg-gray-200'}`}></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Formulário atual */}
                    {renderCurrentStep()}

                    {/* Mensagem de erro */}
                    {error && (
                        <div className="mt-4 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Botões de navegação */}
                    {renderNavigationButtons()}
                </div>
            </div>

            {/* Logo / Imagem lateral */}
            <div className={`${isMobile ? 'w-full h-48 order-1' : 'w-2/3 h-screen'} bg-black flex items-center justify-center`}>
                <div className="text-white">
                    <Image
                        src="/Logo.svg"
                        alt="Sr. Garçom"
                        width={isMobile ? 150 : 250}
                        height={isMobile ? 60 : 100}
                        priority
                    />
                </div>
            </div>
        </div>
    );
}