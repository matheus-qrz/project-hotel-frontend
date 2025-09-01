"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import Header from "@/components/header/Header";
import { Sidebar } from "@/components/sidebar/SideMenu";
import { useSidebar } from "@/components/ui/sidebar";
import { DelayedLoading } from "@/components/loading/DelayedLoading";
import ManagerScreen from "@/components/manager/ManagerScreen";
import { useSession } from "next-auth/react";
import { extractIdFromSlug } from "@/utils/slugify";

export default function ManagerPage() {
  const { isLoading } = useAuthStore();
  const router = useRouter();
  const { isOpen } = useSidebar();
  const { slug } = useParams();
  const { data: session, status } = useSession();
  const token = (session as any)?.token as string | undefined;

  useEffect(() => {
    const t = (session as any)?.token ?? null;
    useAuthStore.getState().setToken(t);
  }, [session]);

  if (!token || status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (isLoading) {
    return <DelayedLoading />;
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-y-hidden bg-background">
      <Header />
      <div
        className={cn(
          "flex w-full flex-col transition-all duration-300",
          isOpen ? "ml-64" : "ml-0",
        )}
      >
        <Sidebar />

        <div className="px-8">
          <ManagerScreen slug={String(slug)} />
        </div>
      </div>
    </div>
  );
}
