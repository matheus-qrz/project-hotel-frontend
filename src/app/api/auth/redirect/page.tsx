// app/auth/redirect/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { generateRestaurantSlug } from "@/utils/slugify";

export default function AuthRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    const user = session?.user as any;
    const info = user?.restaurantInfo;
    const role = user?.role as string | undefined;

    const slug =
      user?.restaurantSlug ??
      (info
        ? generateRestaurantSlug(info.restaurantName, info.restaurantId)
        : null);

    // Destino por role
    const path = slug
      ? role === "MANAGER"
        ? `/admin/restaurant/${slug}/manager`
        : `/admin/restaurant/${slug}/dashboard`
      : "/admin";

    router.replace(path);
  }, [status, session, router]);

  return null;
}
