'use client';
import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

export function useRoleGuard(allowed: Array<'ADMIN'|'MANAGER'|'STAFF'>) {
  const router = useRouter();
  const pathname = usePathname();
  const redirected = useRef(false);
  const { hasHydrated, isLoading, token, user } = useAuthStore();

  const waitingForRole = !!token && !user?.role;

  useEffect(() => {
    if (redirected.current) return;
    if (!hasHydrated || isLoading || waitingForRole) return;
    if (pathname === '/login') return;

    const ok = !!token && (allowed.length ? allowed.includes("ADMIN") || allowed.includes("MANAGER") : true);
    if (!ok) {
      redirected.current = true;
      router.replace('/login');
    }
  }, [hasHydrated, isLoading, waitingForRole, token, user?.role, allowed, pathname, router]);
}