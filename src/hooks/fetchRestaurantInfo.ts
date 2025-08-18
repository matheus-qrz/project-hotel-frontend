import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useRestaurantStore } from '@/stores/index'; // Importa o authStore para obter o token
import { useToast } from '@/hooks/useToast';
import { generateRestaurantSlug } from '@/utils/slugify';
import { useSession } from 'next-auth/react';

const useFetchRestaurantInfo = () => {
    const router = useRouter();
    const { setUserRole, setRestaurantId } = useAuthStore();
    const toast = useToast();
     const { data: session, status } = useSession();
     const token = (session as any)?.token as string | undefined;

    const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!token) {
                    toast.toast({
                        variant: "destructive",
                        title: "Acesso negado",
                        description: "Você precisa estar logado como administrador para criar unidades."
                    });
                    router.push('/');
                    return;
                }

                const response = await fetch(`/${API_URL}/validate`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 401) {
                    throw new Error("Token inválido ou expirado.");
                }

                const data = await response.json();

                if (data && data.user.role === 'ADMIN') {
                    setUserRole(data.user.role); // Armazena o papel do usuário

                    const restaurantName = data.restaurant.name; // Garanta que este valor exista
                    const restaurantId = data.restaurant._id; // Garanta que este valor exista
                    const slug = generateRestaurantSlug(restaurantName, restaurantId);

                    setRestaurantId(data.restaurant._id); // Atualiza o ID do restaurante no store

                    toast.toast({
                        variant: "default",
                        title: "Sucesso",
                        description: "Informações do restaurante carregadas."
                    });

                    // Use o slug no redirecionamento
                    router.push(`/admin/restaurant/${restaurantId}/dashboard`);
                } else {
                    toast.toast({
                        variant: "destructive",
                        title: "Acesso negado",
                        description: "Você precisa ser administrador de um restaurante para criar unidades."
                    });
                    router.push('/');
                }
            } catch (error) {
                console.error("Erro ao buscar informações do restaurante:", error);
                toast.toast({
                    variant: "destructive",
                    title: "Erro",
                    description: "Ocorreu um erro ao verificar suas permissões."
                });
            }
        };

        fetchData();
    }, [token, router, setRestaurantId, setUserRole]); // Adicione dependências
};

export default useFetchRestaurantInfo;