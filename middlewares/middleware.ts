// middleware.ts (raiz do projeto)
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/admin/register', '/recover-password'];

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const pathname = request.nextUrl.pathname;

    const isPublic = PUBLIC_PATHS.some(path => pathname.startsWith(path));

    console.log('🔐 middleware PATH:', pathname);
    console.log('🪪 Token:', token);

    if (!isPublic && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'], 
};
