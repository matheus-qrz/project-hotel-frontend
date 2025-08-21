// src/components/auth/AuthSessionBridge.tsx
"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/stores/auth";

export default function AuthSessionBridge() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // quando logar/atualizar sessão
    const t = (session as any)?.token as string | undefined;
    const role = session?.user?.role ?? null;
    useAuthStore.getState().setToken(t ?? null, role ?? null);
  }, [session, status]);

  return null; // não renderiza nada
}
