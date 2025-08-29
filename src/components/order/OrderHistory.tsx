"use client";

import { useEffect, useRef, useState } from "react";
import { useOrderStore, useRestaurantUnitStore } from "@/stores";
import { extractIdFromSlug } from "@/utils/slugify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react"; // setas

interface OrderHistoryProps {
  slug: string;
}

type OrderStatus =
  | "processing"
  | "completed"
  | "cancelled"
  | "payment_requested"
  | "paid";

const StatusTexts: Record<OrderStatus | "pending", string> = {
  pending: "Pendente",
  processing: "Em preparo",
  completed: "Concluído",
  cancelled: "Cancelado",
  payment_requested: "Pagamento solicitado",
  paid: "Pago",
};

export default function OrderHistory({ slug }: OrderHistoryProps) {
  const { order, fetchRestaurantUnitOrders } = useOrderStore();
  const { currentUnitId } = useRestaurantUnitStore();

  const restaurantId = slug && extractIdFromSlug(String(slug));

  useEffect(() => {
    if (restaurantId || currentUnitId) {
      fetchRestaurantUnitOrders(restaurantId, String(currentUnitId));
      const interval = setInterval(() => {
        fetchRestaurantUnitOrders(restaurantId, String(currentUnitId));
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [restaurantId, currentUnitId, fetchRestaurantUnitOrders]);

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus | "pending", string> = {
      pending: "bg-yellow-200 text-yellow-800",
      processing: "bg-blue-200 text-blue-800",
      completed: "bg-green-200 text-green-800",
      cancelled: "bg-red-200 text-red-800",
      payment_requested: "bg-purple-200 text-purple-800",
      paid: "bg-gray-200 text-gray-800",
    };
    return colors[status];
  };

  const getStatusText = (status: OrderStatus) => StatusTexts[status];

  const renderOrders = (statuses: OrderStatus[]) =>
    order
      .filter((o) => statuses.includes(o.status as OrderStatus))
      .map((o) => (
        <Card
          key={o._id}
          className="mb-4"
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-xl font-semibold text-primary">
              <span>Mesa {o.meta.tableId}</span>
              <Select
                value={o.status}
                disabled={o.status === "paid" || o.status === "cancelled"}
              >
                <SelectTrigger
                  className={`w-[180px] ${getStatusColor(o.status as OrderStatus)}`}
                >
                  <SelectValue>
                    {getStatusText(o.status as OrderStatus) ||
                      "Status Desconhecido"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(StatusTexts) as Array<keyof typeof StatusTexts>
                  ).map((key) => (
                    <SelectItem
                      key={key}
                      value={key}
                    >
                      {StatusTexts[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Cliente:</strong> {o.guestInfo?.name || "Anônimo"}
              </p>
              <p>
                <strong>Itens:</strong>
              </p>
              <ul>
                {o.items.map((item) => (
                  <li key={item._id}>
                    {item.quantity}x {item.name}
                  </li>
                ))}
              </ul>
              <p>
                <strong>Total:</strong> R$ {o.totalAmount.toFixed(2)}
              </p>
              {o.meta?.observations && (
                <p>
                  <strong>Observações:</strong> {o.meta.observations}
                </p>
              )}
              {o.meta?.orderType && (
                <p>
                  <strong>Tipo:</strong>{" "}
                  {o.meta.orderType === "local" ? "Local" : "Para Viagem"}
                </p>
              )}
              {o.meta?.splitCount && o.meta.splitCount > 1 && (
                <p>
                  <strong>Divisão:</strong> {o.meta.splitCount} pessoas
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ));

  // --- MOBILE: carrossel com swipe + setas ---
  const sliderRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  const scrollToIndex = (i: number) => {
    const el = sliderRef.current;
    if (!el) return;
    const width = el.clientWidth;
    el.scrollTo({ left: i * width, behavior: "smooth" });
    setPage(i);
  };
  const prev = () => scrollToIndex(Math.max(0, page - 1));
  const next = () => scrollToIndex(Math.min(1, page + 1));

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    const onScroll = () => {
      const i = Math.round(el.scrollLeft / el.clientWidth);
      setPage(i);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const Column = ({
    title,
    statuses,
  }: {
    title: string;
    statuses: OrderStatus[];
  }) => (
    <div className="max-h-[calc(100vh-200px)] overflow-y-auto rounded-lg bg-white p-6 shadow-sm">
      <h2 className="top-0 mb-6 bg-white py-2 text-xl font-semibold">
        {title}
      </h2>
      <div className="space-y-4">{renderOrders(statuses)}</div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-gray-50">
      <div className="mx-auto w-full p-2">
        {/* MOBILE: slider */}
        <div className="relative md:hidden">
          <div
            ref={sliderRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth"
          >
            <div className="min-w-full snap-start">
              <Column
                title="Pagos"
                statuses={["paid"]}
              />
            </div>
            <div className="min-w-full snap-start">
              <Column
                title="Cancelados"
                statuses={["cancelled"]}
              />
            </div>
          </div>

          {/* Setas (sobrepostas) */}
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
            <Button
              variant="secondary"
              size="icon"
              className="pointer-events-auto h-9 w-9 rounded-full shadow-md"
              onClick={prev}
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1">
            <Button
              variant="secondary"
              size="icon"
              className="pointer-events-auto h-9 w-9 rounded-full shadow-md"
              onClick={next}
              aria-label="Próximo"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Dots de página (opcional) */}
          <div className="mt-2 flex justify-center gap-2">
            <span
              className={`h-1.5 w-5 rounded-full ${page === 0 ? "bg-zinc-900" : "bg-zinc-300"}`}
            />
            <span
              className={`h-1.5 w-5 rounded-full ${page === 1 ? "bg-zinc-900" : "bg-zinc-300"}`}
            />
          </div>
        </div>

        {/* DESKTOP: duas colunas */}
        <div className="hidden md:grid md:grid-cols-2 md:gap-8">
          <Column
            title="Pagos"
            statuses={["paid"]}
          />
          <Column
            title="Cancelados"
            statuses={["cancelled"]}
          />
        </div>
      </div>
    </div>
  );
}
