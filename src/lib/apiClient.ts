// lib/apiClient.ts
import { useAuthStore } from "@/stores/auth";

export const apiClient = async (url: string, options: RequestInit = {}) => {
    const token = useAuthStore.getState().token;

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
