// lib/apiClient.ts
import { useSession } from "next-auth/react";

export const apiClient = async (url: string, options: RequestInit = {}) => {
      const { data: session } = useSession();
      const token = (session as any)?.token as string | undefined;

    const headers: HeadersInit = {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Erro na requisição");
    }

    return response.json();
};
