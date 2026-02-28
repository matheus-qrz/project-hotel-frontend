"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BedDouble,
  ClipboardList,
  BookOpen,
  Users,
  BarChart2,
  QrCode,
  LogOut,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { handleLogout } from "@/utils/handleLogout";
import { useSession } from "next-auth/react";
import { useHotelStore } from "@/stores/hotel";
import { useSidebar } from "@/components/ui/sidebar";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: "danger" | "gold";
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function Sidebar() {
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const { data: session } = useSession();
  const { hotel } = useHotelStore();
  const { isOpen, setIsOpen } = useSidebar();

  const role = session?.user?.role;
  const userName = session?.user?.name ?? "Usuário";
  const userInitial = userName.charAt(0).toUpperCase();
  const hotelName = hotel?.name;

  const slug = (session?.user as any)?.slug;
  const base = `/admin/hotel/${slug}`;

  const allItems: NavItem[] = [
    {
      title: "Painel",
      href: `${base}/dashboard`,
      icon: <LayoutDashboard size={16} />,
    },
    {
      title: "Pedidos",
      href: `${base}/orders`,
      icon: <ClipboardList size={16} />,
      badge: "7",
      badgeVariant: "danger",
    },
    {
      title: "Unidades (Quartos)",
      href: `${base}/units`,
      icon: <BedDouble size={16} />,
    },
    {
      title: "Serviços",
      href: `${base}/services`,
      icon: <Sparkles size={16} />,
      badge: "3",
      badgeVariant: "gold",
    },
    {
      title: "Cardápios & Catálogos",
      href: `${base}/catalogs`,
      icon: <BookOpen size={16} />,
    },
    {
      title: "Funcionários",
      href: `${base}/employees`,
      icon: <Users size={16} />,
    },
    {
      title: "Relatórios",
      href: `${base}/statistics`,
      icon: <BarChart2 size={16} />,
    },
    {
      title: "QR Codes",
      href: `${base}/qrcode`,
      icon: <QrCode size={16} />,
    },
  ];

  const itemsByRole: Record<string, string[]> = {
    ADMIN: allItems.map((i) => i.title),
    MANAGER: [
      "Painel",
      "Pedidos",
      "Funcionários",
      "QR Codes",
      "Cardápios & Catálogos",
    ],
  };

  const items =
    role && itemsByRole[role]
      ? allItems.filter((i) => itemsByRole[role].includes(i.title))
      : allItems;

  const mainItems = items.filter((i) =>
    ["Painel", "Pedidos"].includes(i.title),
  );
  const mgmtItems = items.filter(
    (i) => !["Painel", "Pedidos"].includes(i.title),
  );

  function closeSidebar() {
    setIsOpen(false);
  }

  // Mesmo padrão do restaurante: não renderiza nada se fechada
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-label="Fechar menu"
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
        onClick={closeSidebar}
      />

      {/* Painel */}
      <div
        className="fixed left-0 top-0 z-50 flex h-screen w-60 flex-col bg-[#1A1714]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand */}
        <div className="shrink-0 border-b border-white/10 px-6 pb-6 pt-7">
          <p className="font-serif text-xl font-medium leading-snug text-white">
            {hotelName}
          </p>
          <p className="mt-1 text-xs font-light text-white/40">
            Painel Administrativo
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          <SectionLabel>Principal</SectionLabel>
          {mainItems.map((item) => (
            <NavLink
              key={item.title}
              item={item}
              active={pathname === item.href}
              onClick={closeSidebar}
            />
          ))}

          {mgmtItems.length > 0 && (
            <>
              <SectionLabel className="mt-3">Gestão</SectionLabel>
              {mgmtItems.map((item) => (
                <NavLink
                  key={item.title}
                  item={item}
                  active={pathname === item.href}
                  onClick={closeSidebar}
                />
              ))}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/10">
          {/* Info do usuário */}
          <div className="flex items-center gap-2.5 px-6 py-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-semibold text-white">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {userName}
              </p>
              <p className="text-[11px] text-white/35">
                {role === "ADMIN"
                  ? "Administrador"
                  : role === "MANAGER"
                    ? "Gerente"
                    : "Atendente"}
              </p>
            </div>
          </div>

          {/* Sair + Tema */}
          <div className="flex items-center justify-between px-4 pb-5">
            <Button
              onClick={() => {
                handleLogout();
                closeSidebar();
              }}
              variant="ghost"
              className="flex h-8 items-center gap-2 px-2 text-xs text-white/50 hover:bg-white/5 hover:text-white"
            >
              <LogOut size={14} />
              Sair
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-white/40 hover:bg-white/5 hover:text-white"
                >
                  <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Tema</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-[100px]"
              >
                <DropdownMenuItem
                  onClick={() => {
                    setTheme("light");
                    closeSidebar();
                  }}
                >
                  Claro
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setTheme("dark");
                    closeSidebar();
                  }}
                >
                  Escuro
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setTheme("system");
                    closeSidebar();
                  }}
                >
                  Sistema
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "px-6 pb-1 pt-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30",
        className,
      )}
    >
      {children}
    </p>
  );
}

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 border-l-2 px-6 py-2.5 text-[13px] transition-all",
        active
          ? "border-amber-500 bg-amber-500/10 text-white"
          : "border-transparent text-white/55 hover:bg-white/5 hover:text-white",
      )}
    >
      <span className="shrink-0 opacity-80">{item.icon}</span>
      <span className="flex-1">{item.title}</span>
      {item.badge && (
        <span
          className={cn(
            "min-w-[18px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold text-white",
            item.badgeVariant === "gold" ? "bg-amber-500" : "bg-red-500",
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}
