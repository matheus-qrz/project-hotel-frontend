"use client";
import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function HotelLayout({ children }: { children: ReactNode }) {
  return <SidebarProvider>{children}</SidebarProvider>;
}
