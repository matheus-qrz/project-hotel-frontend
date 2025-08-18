// src/utils/apiClient.ts
import { useAuthStore } from '@/stores/index';
import { redirect } from 'next/navigation'; // caso precise redirecionar em erro

interface FetchOptions extends RequestInit {
    disableRetry?: boolean;
}

// Singleton para manter um cache do token
class TokenCache {
    private static instance: TokenCache;
    private tokenPromise: Promise<string | null> | null = null;
    private tokenTimestamp: number = 0;
    private readonly TOKEN_TTL = 60000; // 1 minuto

    private constructor() { }

    public static getInstance(): TokenCache {
        if (!TokenCache.instance) {
            TokenCache.instance = new TokenCache();
        }
        return TokenCache.instance;
    }

    public async getToken(): Promise<string | null> {
        const now = Date.now();

        if (this.tokenPromise && (now - this.tokenTimestamp) < this.TOKEN_TTL) {
            return this.tokenPromise;
        }

        this.tokenTimestamp = now;
        this.tokenPromise = this.fetchToken();
        return this.tokenPromise;
    }

    private async fetchToken(): Promise<string | null> {
        const storeToken = useAuthStore.getState().token;
        if (storeToken) {
            console.log("Usando token do AuthStore");
            return storeToken;
        }

        console.warn("Token ausente no Zustand");
        return null;
    }

    public invalidateToken(): void {
        this.tokenPromise = null;
        this.tokenTimestamp = 0;
    }
}

export const tokenCache = TokenCache.getInstance();

export async function fetchWithAuth(url: string, options: FetchOptions = {}): Promise<Response> {
    const { disableRetry = false, ...fetchOptions } = options;
    const token = await tokenCache.getToken();

    const requestOptions: RequestInit = {
        ...fetchOptions,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...fetchOptions.headers,
        },
    };

    try {
        const response = await fetch(url, requestOptions);

        if (response.status === 401 && !disableRetry) {
            console.warn("Token inválido ou expirado, tentando invalidar cache...");
            tokenCache.invalidateToken();

            const newToken = await tokenCache.getToken();
            if (newToken) {
                console.log("Novo token obtido, repetindo requisição");
                return fetchWithAuth(url, { ...options, disableRetry: true });
            } else {
                console.error("Token inválido e não recuperado. Redirecionando...");
                useAuthStore.getState().logout();
                if (typeof window !== 'undefined') {
                    window.location.href = '/admin/login';
                } else {
                    redirect('/admin/login'); // Next.js App Router server-side fallback
                }
                throw new Error("Sessão expirada. Por favor, faça login novamente.");
            }
        }

        return response;
    } catch (error) {
        console.error(`Erro na requisição para ${url}:`, error);
        throw error;
    }
}

// Métodos utilitários
export function get(url: string, options: FetchOptions = {}) {
    return fetchWithAuth(url, { ...options, method: 'GET' });
}

export function post(url: string, data: any, options: FetchOptions = {}) {
    return fetchWithAuth(url, {
        ...options,
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function put(url: string, data: any, options: FetchOptions = {}) {
    return fetchWithAuth(url, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export function del(url: string, options: FetchOptions = {}) {
    return fetchWithAuth(url, { ...options, method: 'DELETE' });
}

export default {
    get,
    post,
    put,
    delete: del,
    fetchWithAuth,
};
