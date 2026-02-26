"use client";

import { useState, useMemo } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/header/Header";
import { Sidebar } from "@/components/sidebar/Sidebar";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  Download,
  Plus,
  TrendingUp,
  DollarSign,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = "pending" | "in-progress" | "done" | "cancelled";
type ServiceType = "restaurant" | "bar" | "laundry" | "spa";

interface OrderItem {
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  room: string;
  service: ServiceType;
  items: OrderItem[];
  amount: number;
  createdAt: Date;
  status: OrderStatus;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const SERVICE_META: Record<
  ServiceType,
  { label: string; emoji: string; color: string; bg: string; textColor: string }
> = {
  restaurant: {
    label: "Restaurante",
    emoji: "🍽️",
    color: "#E8B84B",
    bg: "#FEF3CD",
    textColor: "#8A6010",
  },
  bar: {
    label: "Bar",
    emoji: "🍹",
    color: "#5B8FD4",
    bg: "#D6E8FB",
    textColor: "#2C5898",
  },
  laundry: {
    label: "Lavanderia",
    emoji: "👕",
    color: "#5BA85B",
    bg: "#E8F5E8",
    textColor: "#3A7A3A",
  },
  spa: {
    label: "Spa",
    emoji: "💆",
    color: "#B45BD4",
    bg: "#F3E8FB",
    textColor: "#7A3A9A",
  },
};

const STATUS_META: Record<
  OrderStatus,
  { label: string; bg: string; text: string }
> = {
  pending: { label: "Pendente", bg: "bg-amber-100", text: "text-amber-700" },
  "in-progress": {
    label: "Em preparo",
    bg: "bg-blue-100",
    text: "text-blue-700",
  },
  done: { label: "Concluído", bg: "bg-emerald-100", text: "text-emerald-700" },
  cancelled: { label: "Cancelado", bg: "bg-red-100", text: "text-red-600" },
};

const now = new Date();
const minsAgo = (m: number) => new Date(now.getTime() - m * 60_000);

const INITIAL_ORDERS: Order[] = [
  {
    id: "1",
    room: "101",
    service: "restaurant",
    items: [
      { name: "Misto quente", quantity: 2 },
      { name: "Suco de laranja", quantity: 1 },
    ],
    amount: 38,
    createdAt: minsAgo(22),
    status: "pending",
  },
  {
    id: "2",
    room: "204",
    service: "bar",
    items: [
      { name: "Caipirinha", quantity: 1 },
      { name: "Água com gás", quantity: 1 },
    ],
    amount: 32,
    createdAt: minsAgo(11),
    status: "pending",
  },
  {
    id: "3",
    room: "207",
    service: "laundry",
    items: [{ name: "Peças de roupa", quantity: 3 }],
    amount: 45,
    createdAt: minsAgo(70),
    status: "in-progress",
  },
  {
    id: "4",
    room: "312",
    service: "restaurant",
    items: [
      { name: "Prato do dia", quantity: 1 },
      { name: "Refrigerante", quantity: 2 },
    ],
    amount: 67,
    createdAt: minsAgo(8),
    status: "pending",
  },
  {
    id: "5",
    room: "315",
    service: "spa",
    items: [{ name: "Massagem relaxante 45min", quantity: 1 }],
    amount: 120,
    createdAt: minsAgo(22),
    status: "in-progress",
  },
  {
    id: "6",
    room: "418",
    service: "bar",
    items: [{ name: "Cerveja long neck", quantity: 3 }],
    amount: 45,
    createdAt: minsAgo(3),
    status: "pending",
  },
  {
    id: "7",
    room: "502",
    service: "restaurant",
    items: [
      { name: "Café da manhã", quantity: 2 },
      { name: "Suco verde", quantity: 1 },
    ],
    amount: 54,
    createdAt: minsAgo(19),
    status: "in-progress",
  },
  {
    id: "8",
    room: "401",
    service: "bar",
    items: [{ name: "Caipirinha", quantity: 2 }],
    amount: 42,
    createdAt: minsAgo(120),
    status: "done",
  },
  {
    id: "9",
    room: "210",
    service: "restaurant",
    items: [{ name: "Almoço completo", quantity: 1 }],
    amount: 89,
    createdAt: minsAgo(180),
    status: "done",
  },
  {
    id: "10",
    room: "108",
    service: "restaurant",
    items: [{ name: "Jantar especial", quantity: 1 }],
    amount: 95,
    createdAt: minsAgo(240),
    status: "cancelled",
  },
  {
    id: "11",
    room: "220",
    service: "spa",
    items: [{ name: "Esfoliação corporal", quantity: 1 }],
    amount: 90,
    createdAt: minsAgo(200),
    status: "done",
  },
  {
    id: "12",
    room: "305",
    service: "laundry",
    items: [{ name: "Roupas delicadas", quantity: 2 }],
    amount: 35,
    createdAt: minsAgo(160),
    status: "done",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function elapsedMinutes(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 60_000);
}

function formatElapsed(date: Date): string {
  const m = elapsedMinutes(date);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function itemsSummary(items: OrderItem[]): string {
  return items.map((i) => `${i.quantity}x ${i.name}`).join(", ");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, bg, text } = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold",
        bg,
        text,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function ServicePill({ service }: { service: ServiceType }) {
  const { emoji, label, bg, textColor } = SERVICE_META[service];
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide"
      style={{ background: bg, color: textColor }}
    >
      {emoji} {label}
    </span>
  );
}

function ElapsedBadge({ date, status }: { date: Date; status: OrderStatus }) {
  if (status === "done" || status === "cancelled") {
    return (
      <span className="text-xs text-stone-400">há {formatElapsed(date)}</span>
    );
  }
  const m = elapsedMinutes(date);
  const cls =
    m >= 20
      ? "text-red-600 font-semibold"
      : m >= 10
        ? "text-amber-600 font-medium"
        : "text-stone-400";
  return (
    <span className={cn("flex items-center gap-1 text-xs", cls)}>
      <Clock className="h-3 w-3" />
      {formatElapsed(date)}
    </span>
  );
}

// ─── Kanban Card ─────────────────────────────────────────────────────────────

function KanbanCard({
  order,
  onAction,
}: {
  order: Order;
  onAction: (id: string, action: "accept" | "complete" | "cancel") => void;
}) {
  const svc = SERVICE_META[order.service];
  const elapsed = elapsedMinutes(order.createdAt);
  const isDone = order.status === "done" || order.status === "cancelled";

  return (
    <div
      className={cn(
        "cursor-pointer rounded-xl border border-stone-200 bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md",
        order.status === "pending" && "border-l-[3px] border-l-amber-400",
        order.status === "in-progress" && "border-l-[3px] border-l-blue-400",
        order.status === "done" &&
          "border-l-[3px] border-l-emerald-500 opacity-80",
        order.status === "cancelled" &&
          "border-l-[3px] border-l-red-400 opacity-60",
      )}
    >
      {/* Top */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="font-serif text-lg font-medium leading-none">
          {order.room}
        </span>
        <ServicePill service={order.service} />
      </div>

      {/* Items */}
      <p className="mb-2.5 line-clamp-2 text-xs leading-relaxed text-stone-500">
        {itemsSummary(order.items)}
      </p>

      {/* Footer */}
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-sm font-semibold">
          {formatCurrency(order.amount)}
        </span>
        <ElapsedBadge
          date={order.createdAt}
          status={order.status}
        />
      </div>

      {/* Actions */}
      {order.status === "pending" && (
        <div className="flex gap-1.5">
          <Button
            size="sm"
            className="h-7 flex-1 bg-emerald-700 text-xs text-white hover:bg-emerald-800"
            onClick={() => onAction(order.id, "accept")}
          >
            Aceitar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0 text-stone-400 hover:border-red-300 hover:text-red-500"
            onClick={() => onAction(order.id, "cancel")}
          >
            <XCircle className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {order.status === "in-progress" && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-full border-emerald-600 text-xs text-emerald-700 hover:bg-emerald-50"
          onClick={() => onAction(order.id, "complete")}
        >
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Concluir
        </Button>
      )}
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({
  title,
  status,
  orders,
  onAction,
  dotColor,
  countStyle,
}: {
  title: string;
  status: OrderStatus;
  orders: Order[];
  onAction: (id: string, action: "accept" | "complete" | "cancel") => void;
  dotColor: string;
  countStyle: string;
}) {
  // Kanban shows max 3 for done/cancelled to avoid clutter
  const visible =
    status === "done" || status === "cancelled" ? orders.slice(0, 2) : orders;
  const hidden = orders.length - visible.length;

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl bg-stone-100 p-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 px-0.5 pb-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: dotColor }}
          />
          {title}
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            countStyle,
          )}
        >
          {orders.length}
        </span>
      </div>

      {/* Cards */}
      {visible.map((order) => (
        <KanbanCard
          key={order.id}
          order={order}
          onAction={onAction}
        />
      ))}

      {hidden > 0 && (
        <p className="py-2 text-center text-[11px] text-stone-400">
          + {hidden} {status === "done" ? "concluídos" : "cancelados"} — ver na
          lista abaixo
        </p>
      )}

      {orders.length === 0 && (
        <p className="py-4 text-center text-[11px] text-stone-400">
          Nenhum pedido
        </p>
      )}
    </div>
  );
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all",
        active && !color && "border-stone-800 bg-stone-800 text-white",
        active && color && "border-transparent text-white",
        !active &&
          "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:text-stone-700",
      )}
      style={
        active && color ? { background: color, borderColor: color } : undefined
      }
    >
      {label}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HotelOrdersPage() {
  const { isOpen } = useSidebar();
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);

  // Filters
  const [search, setSearch] = useState("");
  const [serviceFilter, setService] = useState<ServiceType | "all">("all");
  const [statusFilter, setStatus] = useState<OrderStatus | "all">("all");

  // ── Actions (mockado) ──
  function handleAction(id: string, action: "accept" | "complete" | "cancel") {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        if (action === "accept") return { ...o, status: "in-progress" };
        if (action === "complete") return { ...o, status: "done" };
        if (action === "cancel") return { ...o, status: "cancelled" };
        return o;
      }),
    );
  }

  // ── Derived ──
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchRoom =
        search === "" || o.room.toLowerCase().includes(search.toLowerCase());
      const matchService =
        serviceFilter === "all" || o.service === serviceFilter;
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      return matchRoom && matchService && matchStatus;
    });
  }, [orders, search, serviceFilter, statusFilter]);

  const byStatus = (s: OrderStatus) => filtered.filter((o) => o.status === s);

  const totalToday = orders.length;
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const inProgCount = orders.filter((o) => o.status === "in-progress").length;
  const doneCount = orders.filter((o) => o.status === "done").length;
  const revenueToday = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.amount, 0);
  const urgentCount = orders.filter(
    (o) => o.status === "pending" && elapsedMinutes(o.createdAt) >= 15,
  ).length;

  return (
    <div className="flex h-screen w-full flex-col">
      <div
        className={cn(
          "flex w-screen flex-col transition-all duration-300",
          isOpen ? "ml-64" : "ml-0",
        )}
      >
        <Sidebar />

        <div className="min-h-screen bg-[#F7F5F2]">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-8 py-7">
            {/* ── Page header ── */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-serif text-2xl font-medium">
                  Pedidos em andamento
                </h1>
                <p className="mt-1 text-xs text-stone-400">
                  Acompanhe e gerencie todos os pedidos do hotel em tempo real
                </p>
              </div>
              <Button className="gap-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800">
                <Plus className="h-4 w-4" />
                Novo pedido manual
              </Button>
            </div>

            {/* ── Alert (quando há pedidos urgentes) ── */}
            {urgentCount > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-3.5">
                <span className="shrink-0 text-lg">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-red-600">
                    {urgentCount}{" "}
                    {urgentCount === 1 ? "pedido aguarda" : "pedidos aguardam"}{" "}
                    atenção
                  </p>
                  <p className="mt-0.5 text-xs text-red-400">
                    Pendentes há mais de 15 minutos
                  </p>
                </div>
              </div>
            )}

            {/* ── Summary strip ── */}
            <div className="grid grid-cols-4 gap-3">
              {[
                {
                  icon: <Clock className="h-5 w-5" />,
                  label: "Pendentes",
                  value: pendingCount,
                  color: "text-amber-600",
                  delta:
                    urgentCount > 0 ? `${urgentCount} urgentes` : undefined,
                  deltaColor: "text-red-500",
                },
                {
                  icon: <Loader2 className="h-5 w-5" />,
                  label: "Em preparo",
                  value: inProgCount,
                  color: "text-blue-600",
                  delta: undefined,
                },
                {
                  icon: <CheckCircle2 className="h-5 w-5" />,
                  label: "Concluídos hoje",
                  value: doneCount,
                  color: "text-emerald-700",
                  delta: undefined,
                },
                {
                  icon: <DollarSign className="h-5 w-5" />,
                  label: "Faturado hoje",
                  value: formatCurrency(revenueToday),
                  color: "text-stone-800",
                  delta: undefined,
                  isText: true,
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3.5 rounded-xl border border-stone-200 bg-white px-5 py-4"
                >
                  <div className={cn("shrink-0", s.color)}>{s.icon}</div>
                  <div>
                    <p className="text-[11px] text-stone-400">{s.label}</p>
                    <p
                      className={cn("font-serif text-xl font-medium", s.color)}
                    >
                      {s.value}
                    </p>
                    {s.delta && (
                      <p
                        className={cn(
                          "mt-0.5 text-[10px] font-medium",
                          s.deltaColor,
                        )}
                      >
                        {s.delta}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Filters ── */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                <Input
                  placeholder="Buscar quarto (ex: 101)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-52 rounded-xl border-stone-200 bg-white pl-8 text-sm"
                />
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-stone-200" />

              {/* Service filter */}
              <div className="flex items-center gap-1.5">
                <span className="mr-0.5 text-[11px] font-medium text-stone-400">
                  Serviço
                </span>
                {(["all", "restaurant", "bar", "laundry", "spa"] as const).map(
                  (s) => (
                    <FilterChip
                      key={s}
                      label={
                        s === "all"
                          ? "Todos"
                          : SERVICE_META[s].emoji + " " + SERVICE_META[s].label
                      }
                      active={serviceFilter === s}
                      onClick={() => setService(s)}
                      color={s !== "all" ? SERVICE_META[s].color : undefined}
                    />
                  ),
                )}
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-stone-200" />

              {/* Status filter */}
              <div className="flex items-center gap-1.5">
                <span className="mr-0.5 text-[11px] font-medium text-stone-400">
                  Status
                </span>
                {(
                  [
                    "all",
                    "pending",
                    "in-progress",
                    "done",
                    "cancelled",
                  ] as const
                ).map((s) => (
                  <FilterChip
                    key={s}
                    label={s === "all" ? "Todos" : STATUS_META[s].label}
                    active={statusFilter === s}
                    onClick={() => setStatus(s)}
                  />
                ))}
              </div>
            </div>

            {/* ── Kanban ── */}
            <div className="grid grid-cols-4 gap-3.5">
              <KanbanColumn
                title="Pendentes"
                status="pending"
                orders={byStatus("pending")}
                onAction={handleAction}
                dotColor="#E8B84B"
                countStyle="bg-amber-100 text-amber-700"
              />
              <KanbanColumn
                title="Em preparo"
                status="in-progress"
                orders={byStatus("in-progress")}
                onAction={handleAction}
                dotColor="#5B8FD4"
                countStyle="bg-blue-100 text-blue-700"
              />
              <KanbanColumn
                title="Concluídos"
                status="done"
                orders={byStatus("done")}
                onAction={handleAction}
                dotColor="#2C5F4A"
                countStyle="bg-emerald-100 text-emerald-700"
              />
              <KanbanColumn
                title="Cancelados"
                status="cancelled"
                orders={byStatus("cancelled")}
                onAction={handleAction}
                dotColor="#B94040"
                countStyle="bg-red-100 text-red-600"
              />
            </div>

            {/* ── Divider ── */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-stone-200" />
              <span className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-stone-400">
                📋 Histórico completo de hoje · {totalToday} pedidos
              </span>
              <div className="h-px flex-1 bg-stone-200" />
            </div>

            {/* ── Table ── */}
            <div className="mb-8 overflow-hidden rounded-2xl border border-stone-200 bg-white">
              {/* Table header */}
              <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
                <div className="flex items-center gap-2.5 text-sm font-semibold">
                  Todos os pedidos
                  <span className="text-[11px] font-normal text-stone-400">
                    {filtered.length} pedidos
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 rounded-lg text-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  Exportar
                </Button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-stone-50">
                      {[
                        "Quarto",
                        "Serviço",
                        "Itens",
                        "Valor",
                        "Horário",
                        "Tempo",
                        "Status",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-12 text-center text-sm text-stone-400"
                        >
                          Nenhum pedido encontrado com os filtros aplicados.
                        </td>
                      </tr>
                    )}
                    {filtered.map((order) => {
                      const svc = SERVICE_META[order.service];
                      const isDone =
                        order.status === "done" || order.status === "cancelled";
                      return (
                        <tr
                          key={order.id}
                          className="border-t border-stone-100 transition-colors hover:bg-stone-50"
                        >
                          {/* Quarto */}
                          <td className="px-4 py-3.5">
                            <span className="font-serif text-base font-medium">
                              {order.room}
                            </span>
                          </td>

                          {/* Serviço */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ background: svc.color }}
                              />
                              <span className="text-sm">{svc.label}</span>
                            </div>
                          </td>

                          {/* Itens */}
                          <td className="max-w-[220px] px-4 py-3.5">
                            <p className="truncate text-xs text-stone-500">
                              {itemsSummary(order.items)}
                            </p>
                          </td>

                          {/* Valor */}
                          <td className="px-4 py-3.5">
                            <span className="text-sm font-semibold">
                              {formatCurrency(order.amount)}
                            </span>
                          </td>

                          {/* Horário */}
                          <td className="px-4 py-3.5">
                            <span className="text-xs text-stone-400">
                              {formatTime(order.createdAt)}
                            </span>
                          </td>

                          {/* Tempo */}
                          <td className="px-4 py-3.5">
                            <ElapsedBadge
                              date={order.createdAt}
                              status={order.status}
                            />
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            <StatusBadge status={order.status} />
                          </td>

                          {/* Ações */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-end gap-2">
                              {order.status === "pending" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleAction(order.id, "accept")
                                    }
                                    className="rounded-lg border border-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition-all hover:bg-emerald-700 hover:text-white"
                                  >
                                    Aceitar
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleAction(order.id, "cancel")
                                    }
                                    className="rounded-lg border border-stone-200 px-2.5 py-1 text-[11px] font-semibold text-stone-400 transition-all hover:border-red-300 hover:text-red-500"
                                  >
                                    Cancelar
                                  </button>
                                </>
                              )}
                              {order.status === "in-progress" && (
                                <button
                                  onClick={() =>
                                    handleAction(order.id, "complete")
                                  }
                                  className="rounded-lg border border-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition-all hover:bg-emerald-700 hover:text-white"
                                >
                                  Concluir
                                </button>
                              )}
                              <button className="rounded-lg border border-stone-200 px-2.5 py-1 text-[11px] font-semibold text-stone-400 transition-all hover:bg-stone-50">
                                Ver
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
