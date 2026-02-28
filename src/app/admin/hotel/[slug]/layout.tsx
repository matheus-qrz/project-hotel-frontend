"use client";

import { ReactNode, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useHotelStore } from "@/stores";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

// Layout específico para o login
export default function AdminHotelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { data: session } = useSession();
  const { fetchHotelData } = useHotelStore();
  const slug = (session?.user as any)?.slug;

  useEffect(() => {
    if (slug) fetchHotelData(slug);
  }, [slug]);

  return <SidebarProvider>{children}</SidebarProvider>;
}
