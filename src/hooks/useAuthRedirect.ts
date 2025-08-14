// hooks/useAuthRedirect.ts
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";

export const useAuthRedirect = () => {
    const { token } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!token) {
            router.push("/login"); // ou "/admin/login", conforme sua estrutura
        }
    }, [token, router]);
};
