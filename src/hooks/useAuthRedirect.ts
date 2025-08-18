// hooks/useAuthRedirect.ts
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export const useAuthRedirect = () => {
    const router = useRouter();
      const { data: session } = useSession();
      const token = (session as any)?.token as string | undefined;

    useEffect(() => {
        if (!token) {
            router.push("/login"); 
        }
    }, [token, router]);
};
