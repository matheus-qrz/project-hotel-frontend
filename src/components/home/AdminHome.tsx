"use client";

import { Bell, RefreshCcw } from "lucide-react";
import { useState } from "react";
import {
  MonthRevenue,
  RecentOrder,
  RoomActivity,
  RoomStatus,
  ServiceBreakdown,
  ServiceType,
  OrderStatus,
} from "./types";
import { Label } from "../ui/label";
import { Sidebar } from "../dashboard";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const SERVICE_COLOR: Record<ServiceType, string> = {
  restaurant: "#E8B84B",
  bar: "#5B8FD4",
  laundry: "#5BA85B",
  spa: "#B45BD4",
};

const roomsActivity: RoomActivity[] = [
  { number: "101", status: "alert", services: ["restaurant"] },
  { number: "204", status: "pending", services: ["bar", "restaurant"] },
  { number: "207", status: "in-progress", services: ["laundry"] },
  { number: "312", status: "pending", services: ["restaurant"] },
  { number: "315", status: "in-progress", services: ["restaurant", "spa"] },
  { number: "401", status: "idle", services: ["bar"] },
  { number: "418", status: "alert", services: ["bar"] },
  { number: "502", status: "idle", services: ["restaurant", "laundry"] },
];

const serviceBreakdown: ServiceBreakdown[] = [
  {
    type: "restaurant",
    emoji: "🍽️",
    label: "Restaurante",
    count: 21,
    revenue: 514,
    color: "#E8B84B",
  },
  {
    type: "bar",
    emoji: "🍹",
    label: "Bar",
    count: 10,
    revenue: 189,
    color: "#5B8FD4",
  },
  {
    type: "laundry",
    emoji: "👕",
    label: "Lavanderia",
    count: 5,
    revenue: 95,
    color: "#5BA85B",
  },
  {
    type: "spa",
    emoji: "💆",
    label: "Spa",
    count: 4,
    revenue: 49,
    color: "#B45BD4",
  },
];

const maxServiceCount = Math.max(...serviceBreakdown.map((s) => s.count));

const recentOrders: RecentOrder[] = [
  {
    room: "101",
    description: "2x Misto quente, 1x Suco",
    service: "restaurant",
    serviceLabel: "Restaurante",
    serviceEmoji: "🍽️",
    amount: 38,
    status: "pending",
    timeAgo: "há 18 min",
  },
  {
    room: "315",
    description: "1x Massagem relaxante",
    service: "spa",
    serviceLabel: "Spa",
    serviceEmoji: "💆",
    amount: 120,
    status: "in-progress",
    timeAgo: "há 22 min",
  },
  {
    room: "207",
    description: "3 peças de roupa",
    service: "laundry",
    serviceLabel: "Lavanderia",
    serviceEmoji: "👕",
    amount: 45,
    status: "in-progress",
    timeAgo: "há 1h 10m",
  },
  {
    room: "502",
    description: "2x Caipirinha",
    service: "bar",
    serviceLabel: "Bar",
    serviceEmoji: "🍹",
    amount: 42,
    status: "done",
    timeAgo: "há 2h",
  },
];

const monthlyRevenue: MonthRevenue[] = [
  { month: "set", value: 20 },
  { month: "out", value: 35 },
  { month: "nov", value: 30 },
  { month: "dez", value: 55 },
  { month: "jan", value: 80 },
  { month: "fev", value: 62 },
];

const timingData = [
  { emoji: "🍽️", label: "Restaurante", value: "28 min", level: "warn" },
  { emoji: "🍹", label: "Bar", value: "12 min", level: "good" },
  { emoji: "👕", label: "Lavanderia", value: "4h 20m", level: "good" },
  { emoji: "💆", label: "Spa", value: "18 min", level: "good" },
];

const quickActions = [
  {
    emoji: "🛏️",
    label: "Gerenciar Quartos",
    desc: "Unidades, status e QR codes",
    color: "bg-emerald-50",
  },
  {
    emoji: "🍽️",
    label: "Serviços & Catálogos",
    desc: "Restaurante, bar, spa e mais",
    color: "bg-amber-50",
  },
  {
    emoji: "📋",
    label: "Pedidos Ativos",
    desc: "7 pedidos em andamento",
    color: "bg-blue-50",
  },
  {
    emoji: "👥",
    label: "Funcionários",
    desc: "Equipe e permissões",
    color: "bg-purple-50",
  },
];

const navItems = [
  { label: "Painel", active: true, badge: null },
  { label: "Pedidos", active: false, badge: "7" },
  { label: "Unidades (Quartos)", active: false, badge: null },
  { label: "Serviços", active: false, badge: "3" },
  { label: "Cardápios & Catálogos", active: false, badge: null },
  { label: "Funcionários", active: false, badge: null },
  { label: "Relatórios", active: false, badge: null },
  { label: "QR Codes", active: false, badge: null },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoomStatusPill({ room }: { room: RoomActivity }) {
  const styles: Record<RoomStatus, string> = {
    alert: "border-red-400 bg-red-50 text-red-600",
    pending: "border-amber-400 bg-amber-50 text-amber-700",
    "in-progress": "border-blue-400 bg-blue-50 text-blue-700",
    idle: "border-stone-200 bg-white text-stone-400 opacity-50",
  };

  const labels: Record<RoomStatus, string> = {
    alert: "Pendente",
    pending: "Pendente",
    "in-progress": "Em preparo",
    idle: "Concluído",
  };

  return (
    <div
      className={`cursor-pointer rounded-xl border-[1.5px] px-2 py-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-md ${styles[room.status]}`}
    >
      <div className="text-lg font-medium">{room.number}</div>
      <div className="mt-0.5 text-[10px] font-medium">
        {labels[room.status]}
      </div>
      <div className="mt-1.5 flex flex-wrap justify-center gap-1">
        {room.services.map((svc) => (
          <span
            key={svc}
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{
              background: room.status === "idle" ? "#ccc" : SERVICE_COLOR[svc],
            }}
          />
        ))}
      </div>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    pending: "bg-amber-100 text-amber-700",
    "in-progress": "bg-blue-100 text-blue-700",
    done: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-600",
  };
  const labels: Record<OrderStatus, string> = {
    pending: "Pendente",
    "in-progress": "Em preparo",
    done: "Concluído",
    cancelled: "Cancelado",
  };
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function TimingLevel({ level }: { level: string }) {
  const colors: Record<string, string> = {
    good: "text-emerald-700",
    warn: "text-amber-600",
    bad: "text-red-600",
  };
  return colors[level] || "text-stone-700";
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminHome() {
  return (
    <div className="flex min-h-screen max-w-full bg-[#F7F5F2] font-sans text-[#1A1714]">
      {/* ── Sidebar ── */}
      <Sidebar />

      {/* ── Main ── */}
      <main className="ml-56 flex min-h-screen flex-1 flex-col">
        {/* Topbar */}

        <div className="flex animate-[fadeUp_0.4s_ease_both] flex-col gap-8 p-8">
          {/* ── Alert Strip ── */}
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-3.5">
            <span className="shrink-0 text-lg">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-red-600">
                4 pedidos aguardando atenção
              </p>
              <p className="mt-0.5 text-xs text-red-400">
                Quartos 101, 204, 312 e 418 com pedidos pendentes há mais de 15
                min
              </p>
            </div>
            <button className="ml-auto whitespace-nowrap text-xs font-semibold text-red-600 underline">
              Ver todos →
            </button>
          </div>

          {/* ── Quick Actions ── */}
          <section>
            <h2 className="mb-4 text-xl font-medium">Ações rápidas</h2>
            <div className="grid grid-cols-4 gap-3">
              {quickActions.map((qa) => (
                <button
                  key={qa.label}
                  className="flex cursor-pointer items-center gap-3.5 rounded-xl border border-stone-200 bg-white p-4 text-left transition-all hover:-translate-y-px hover:border-emerald-600 hover:shadow-[0_0_0_3px_#EAF2EE]"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${qa.color}`}
                  >
                    {qa.emoji}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium leading-snug">
                      {qa.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-stone-400">
                      {qa.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ── Room Activity ── */}
          <section>
            <div className="mb-4 flex items-baseline justify-between">
              <div>
                <h2 className="text-xl font-medium">
                  Quartos com atividade hoje
                </h2>
                <p className="mt-0.5 text-xs text-stone-400">
                  Somente quartos que fizeram algum pedido. Clique para ver
                  detalhes.
                </p>
              </div>
              <button className="text-xs font-medium text-emerald-700">
                Ver todos os quartos →
              </button>
            </div>

            <div className="grid grid-cols-8 gap-2.5">
              {roomsActivity.map((room) => (
                <RoomStatusPill
                  key={room.number}
                  room={room}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-4">
              {[
                { color: SERVICE_COLOR.restaurant, label: "Restaurante" },
                { color: SERVICE_COLOR.bar, label: "Bar" },
                { color: SERVICE_COLOR.laundry, label: "Lavanderia" },
                { color: SERVICE_COLOR.spa, label: "Spa" },
                { color: "#ccc", label: "Concluído" },
              ].map((l) => (
                <div
                  key={l.label}
                  className="flex items-center gap-1.5 text-[10px] text-stone-400"
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: l.color }}
                  />
                  {l.label}
                </div>
              ))}
            </div>
          </section>

          {/* ── Dashboard Grid ── */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-medium">Resumo do dia</h2>
              <p className="mt-0.5 text-xs text-stone-400">
                Dados consolidados de todos os serviços de hoje
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Card: Faturamento */}
              <div className="rounded-xl border border-stone-200 bg-white p-6">
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[13px] font-semibold">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-sm">
                        💰
                      </span>
                      Faturamento
                    </div>
                    <p className="mt-1 text-[11px] text-stone-400">
                      Receita de todos os serviços hoje
                    </p>
                  </div>
                  <button className="text-[11px] font-medium text-emerald-700">
                    Ver detalhes
                  </button>
                </div>

                {/* KPIs */}
                <div className="mb-5 flex gap-5 border-b border-stone-100 pb-5">
                  <div className="flex-1">
                    <p className="mb-1 text-[11px] text-stone-400">Hoje</p>
                    <p className="text-emerald-700">
                      <Label className="text-xl font-medium">R$ 847</Label>
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-emerald-600">
                      ↑ +23% vs ontem
                    </p>
                  </div>
                  <div className="flex-1 border-l border-r border-stone-100 px-5">
                    <p className="mb-1 text-[11px] text-stone-400">Mês atual</p>
                    <p className="text-2xl font-medium">R$ 12.430</p>
                    <p className="mt-0.5 text-[11px] font-medium text-emerald-600">
                      ↑ +8% vs mês ant.
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 text-[11px] text-stone-400">
                      Ticket médio
                    </p>
                    <p className="text-2xl font-medium text-amber-600">
                      <Label className="text-xl font-medium">R$ 121</Label>
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-stone-400">
                      — estável
                    </p>
                  </div>
                </div>

                {/* Mini bar chart */}
                <div className="flex h-20 items-end gap-1.5">
                  {monthlyRevenue.map((m, i) => {
                    const isLast = i === monthlyRevenue.length - 1;
                    const isCurrent = i === monthlyRevenue.length - 2;
                    return (
                      <div
                        key={m.month}
                        className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                      >
                        <div
                          className="w-full rounded-t-sm transition-all"
                          style={{
                            height: `${m.value}%`,
                            background: isCurrent
                              ? "#2C5F4A"
                              : isLast
                                ? "#C4923A"
                                : "#D9D4CC",
                          }}
                        />
                        <span className="text-[9px] text-stone-400">
                          {m.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card: Pedidos por Serviço */}
              <div className="rounded-xl border border-stone-200 bg-white p-6">
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[13px] font-semibold">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-sm">
                        📊
                      </span>
                      Pedidos por Serviço
                    </div>
                    <p className="mt-1 text-[11px] text-stone-400">
                      Distribuição de hoje por categoria
                    </p>
                  </div>
                  <button className="text-[11px] font-medium text-emerald-700">
                    Ver detalhes
                  </button>
                </div>

                <div className="flex flex-col gap-2.5">
                  {serviceBreakdown.map((svc) => (
                    <div
                      key={svc.type}
                      className="flex items-center gap-2.5"
                    >
                      <span className="w-5 shrink-0 text-center text-sm">
                        {svc.emoji}
                      </span>
                      <span className="w-24 shrink-0 text-xs font-medium">
                        {svc.label}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(svc.count / maxServiceCount) * 100}%`,
                            background: svc.color,
                          }}
                        />
                      </div>
                      <span className="w-5 shrink-0 text-right text-xs font-semibold">
                        {svc.count}
                      </span>
                      <span className="w-16 shrink-0 text-right text-[11px] text-stone-400">
                        R$ {svc.revenue.toLocaleString("pt-BR")}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                  <p className="text-xs text-stone-400">
                    Total hoje:{" "}
                    <strong className="text-stone-700">40 pedidos</strong>
                  </p>
                  <p className="text-[11px] font-medium text-red-500">
                    4 cancelados
                  </p>
                </div>
              </div>

              {/* Card: Tempo médio */}
              <div className="rounded-xl border border-stone-200 bg-white p-6">
                <div className="mb-5">
                  <div className="flex items-center gap-2 text-[13px] font-semibold">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-sm">
                      ⏱️
                    </span>
                    Tempo Médio de Atendimento
                  </div>
                  <p className="mt-1 text-[11px] text-stone-400">
                    Por categoria de serviço
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {timingData.map((t) => (
                    <div
                      key={t.label}
                      className="flex items-center gap-2.5 rounded-lg bg-stone-50 px-3 py-3"
                    >
                      <span className="shrink-0 text-lg">{t.emoji}</span>
                      <div>
                        <p className="text-[11px] text-stone-400">{t.label}</p>
                        <p
                          className={`text-[15px] font-semibold ${TimingLevel({ level: t.level })}`}
                        >
                          {t.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card: Últimos pedidos */}
              <div className="rounded-xl border border-stone-200 bg-white p-6">
                <div className="mb-5 flex items-start justify-between">
                  <div className="flex items-center gap-2 text-[13px] font-semibold">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-sm">
                      🧾
                    </span>
                    Últimos Pedidos
                  </div>
                  <button className="text-[11px] font-medium text-emerald-700">
                    Ver todos
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  {recentOrders.map((order, i) => (
                    <div
                      key={i}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-stone-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-sm font-medium">
                        {order.room}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">
                          {order.description}
                        </p>
                        <p className="mt-0.5 text-[11px] text-stone-400">
                          {order.serviceEmoji} {order.serviceLabel} · R${" "}
                          {order.amount.toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                      <span className="shrink-0 whitespace-nowrap text-[11px] text-stone-400">
                        {order.timeAgo}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({
  label,
  active,
  badge,
}: {
  label: string;
  active: boolean;
  badge: string | null;
}) {
  return (
    <button
      className={`flex w-full items-center gap-2.5 border-l-2 px-6 py-2.5 text-[13px] transition-all ${
        active
          ? "border-amber-500 bg-amber-500/10 text-white"
          : "border-transparent text-white/55 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span
          className={`min-w-[18px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold ${
            active || label === "Pedidos"
              ? "bg-red-500 text-white"
              : "bg-amber-500 text-white"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
