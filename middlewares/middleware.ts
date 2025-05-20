import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { generateRestaurantSlug } from '@/utils/slugify';

// Helper para verificar se a rota está em um ciclo de redirecionamento
function isRedirectLoop(request: NextRequest): boolean {
    const redirectCount = request.cookies.get('redirect_count')?.value;
    const currentCount = redirectCount ? parseInt(redirectCount) : 0;

    // Se tivermos mais de 2 redirecionamentos seguidos, consideramos um loop
    return currentCount >= 2;
}

// Helper para atualizar o contador de redirecionamentos
function updateRedirectCount(response: NextResponse, increment: boolean): NextResponse {
    const redirectCount = response.cookies.get('redirect_count')?.value;
    const currentCount = redirectCount ? parseInt(redirectCount) : 0;

    if (increment) {
        response.cookies.set('redirect_count', (currentCount + 1).toString(), {
            maxAge: 5, // Expira em 5 segundos para evitar contagem permanente
            path: '/',
        });
    } else {
        // Se não estamos redirecionando, resetamos o contador
        response.cookies.set('redirect_count', '0', {
            maxAge: 5,
            path: '/',
        });
    }

    return response;
}

export async function middleware(request: NextRequest) {
    try {
        // Verificar se estamos em um loop de redirecionamento
        if (isRedirectLoop(request)) {
            console.warn('Detectado ciclo de redirecionamento! Permitindo acesso para quebrar o ciclo.');
            const response = NextResponse.next();
            return updateRedirectCount(response, false);
        }

        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET
        });

        const path = request.nextUrl.pathname;
        const isAdminRoute = path.startsWith('/restaurant');
        const isManagerRoute = path.startsWith('/manager');
        const isLoginRoute = path === '/login';
        const isApiAuthRoute = path.startsWith('/api/auth');

        if (isApiAuthRoute) {
            return NextResponse.next();
        }

        // middleware.ts
        if (isAdminRoute) {
            if (!token || (token.role !== 'ADMIN' && token.role !== 'MANAGER')) {
                return NextResponse.redirect(new URL('/login', request.url));
            }

            const pathParts = path.split('/');
            const slug = pathParts[2];

            if (!slug || slug === 'undefined') {
                if (token.restaurantId && token.restaurantName) {
                    const newSlug = generateRestaurantSlug(String(token.restaurantName), token.restaurantId);
                    const newPath = `/restaurant/${newSlug}/dashboard`;
                    return NextResponse.redirect(new URL(newPath, request.url));
                }
                return NextResponse.redirect(new URL('/restaurant-selection', request.url));
            }
        }

        if (isLoginRoute && token) {
            if (token.role === 'ADMIN') {
                const slug = generateRestaurantSlug(String(token.restaurantName), String(token.restaurantId));
                if (slug) {
                    console.log(`Redirecionando usuário autenticado para dashboard: ${slug}`);
                    const response = NextResponse.redirect(new URL(`/restaurant/${slug}/dashboard`, request.url));
                    return updateRedirectCount(response, true);
                }
            }

            if (token.role === 'MANAGER') {
                const slug = generateRestaurantSlug(String(token.restaurantName), String(token.restaurantId));
                if (slug) {
                    console.log(`Redirecionando usuário autenticado para tela de pedidos: ${slug}`);
                    const response = NextResponse.redirect(new URL(`/restaurant/${slug}/manager`, request.url));
                    return updateRedirectCount(response, true);
                }
            }

            console.log('Redirecionando usuário autenticado com role desconhecida para home');
            const response = NextResponse.redirect(new URL('/', request.url));
            return updateRedirectCount(response, true);
        }

        const response = NextResponse.next();
        return updateRedirectCount(response, false);

    } catch (error) {
        console.error("Erro no middleware:", error);
        const response = NextResponse.redirect(new URL('/login', request.url));
        return updateRedirectCount(response, true);
    }
}

export const config = {
    matcher: [
        '/restaurant/:path*',
        '/manager/:path*',
        '/login',
        '/api/auth/:path*',
    ],
};