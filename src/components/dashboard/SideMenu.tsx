"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  BadgePercent,
  BarChart,
  Store,
  Sun,
  Home,
  LogOut,
  UserCog2,
  Moon,
  SquareMenu,
  QrCode,
  History,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { signOut } from "next-auth/react";
import { useAuthStore } from "@/stores";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { slug } = useParams();
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const { isOpen } = useSidebar();
  const { role } = useAuthStore();

  if (!isOpen) {
    return null;
  }

  const handleLogout = async (redirectUrl = "/login") => {
    const store = useAuthStore.getState();

    // 1) zera estado em memória (sincrono p/ evitar flicker)
    store.setIsAuthenticated(false);
    store.setToken("");
    store.setUserRole("");
    store.setRestaurantId("");

    // 2) se estiver usando persist, limpe o storage
    try {
      // Zustand persist adiciona helpers no hook:
      // useAuthStore.persist?.clearStorage?.() existe na maioria das configs.
      // Se não existir no seu setup, pode usar localStorage.removeItem('auth')
      (useAuthStore as any).persist?.clearStorage?.();
    } catch {}

    // 3) encerra sessão no NextAuth e redireciona
    await signOut({ redirect: true, callbackUrl: redirectUrl });
  };

  const allItems: NavItem[] = [
    {
      title: "Início",
      href:
        role === "ADMIN"
          ? `/admin/restaurant/${slug}/dashboard`
          : `/admin/restaurant/${slug}/manager`,
      icon: <Home size={20} />,
      color: "#ef4444",
    },
    {
      title: "Funcionários",
      href: `/admin/restaurant/${slug}/employees`,
      icon: <UserCog2 size={20} />,
      color: "#84cc16",
    },
    {
      title: "Unidades",
      href: `/admin/restaurant/${slug}/units`,
      icon: <Store size={20} />,
      color: "#d946ef",
    },
    {
      title: "QR-Code",
      href: `/admin/restaurant/${slug}/qrcode`,
      icon: <QrCode size={20} />,
      color: "#0400ff",
    },
    {
      title: "Menu",
      href: `/admin/restaurant/${slug}/products`,
      icon: <SquareMenu size={20} />,
      color: "#f3de1f",
    },
    {
      title: "Promoções",
      href: `/admin/restaurant/${slug}/promotions`,
      icon: <BadgePercent size={20} />,
      color: "#f97316",
    },
    {
      title: "Estatísticas",
      href: `/admin/restaurant/${slug}/statistics`,
      icon: <BarChart size={20} />,
      color: "#06b6d4",
    },
    {
      title: "Histórico de pedidos",
      href: `/admin/restaurant/${slug}/order/history`,
      icon: <History size={20} />,
      color: "#10b981",
    },
  ];

  const filterItemsByRole = (role: string): NavItem[] => {
    if (role === "ADMIN") {
      return allItems;
    } else if (role === "MANAGER") {
      return allItems.filter((item) =>
        [
          "Início",
          "Funcionários",
          "QR-Code",
          "Menu",
          "Promoções",
          "Histórico de pedidos",
        ].includes(item.title),
      );
    }
    return [];
  };

  const items = filterItemsByRole(String(role));

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-screen w-72 border-r border-border bg-background",
        className,
      )}
    >
      <div className="flex h-full flex-col bg-secondary pt-6">
        <div className="flex-1 bg-background pt-16">
          <nav className="space-y-1 bg-background">
            {items.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-8 py-4 text-primary transition-all hover:bg-primary-foreground",
                  pathname === item.href ? "bg-background" : "",
                )}
              >
                <span style={{ color: item.color }}>{item.icon}</span>
                <span className="text-primary">{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Footer da sidebar */}
        <div className="mt-auto border-t border-border bg-background">
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row items-center">
              <Button
                onClick={() => handleLogout()}
                className="flex cursor-pointer items-center gap-4 border-none bg-transparent px-6 text-secondary shadow-none"
              >
                <LogOut
                  size={20}
                  className="text-gray-500"
                />
                <span className="cursor-pointer text-primary">Desconectar</span>
              </Button>
            </div>
            <div className="flex items-end justify-between gap-2 px-5 py-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                  >
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    System
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile Sidebar with Sheet component
export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="bg-white p-0"
      >
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
}
