"use client";

import { SidebarProvider } from "@/components/ui/sidebar";

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SidebarProvider>{children}</SidebarProvider>
    </>
  );
}
