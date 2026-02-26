import { SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";

// Layout específico para o login
export default function AdminHotelLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <SidebarProvider>{children}</SidebarProvider>;
}
