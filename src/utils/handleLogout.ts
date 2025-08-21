import { useAuthStore } from "@/stores";
import { signOut } from "next-auth/react";

export const handleLogout = async (redirectUrl = "/login") => {
    const store = useAuthStore.getState();

    // 1) zera estado em memória (sincrono p/ evitar flicker)
    store.setIsAuthenticated(false);
    store.setToken("");
    store.setUserRole("");
    store.setRestaurantId("");

    // 2) se estiver usando persist, limpe o storage
    try {
      // Zustand persist adiciona helpers no hook:
      // useAuthStore.persist?.clearStorage?.() existe na maioria das configs.
      // Se não existir no seu setup, pode usar localStorage.removeItem('auth')
      (useAuthStore as any).persist?.clearStorage?.();
    } catch {}

    // 3) encerra sessão no NextAuth e redireciona
    await signOut({ redirect: true, callbackUrl: redirectUrl });
  };