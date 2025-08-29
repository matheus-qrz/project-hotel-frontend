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
import { ChevronLeft, ChevronRight, Printer, Download } from "lucide-react";

interface OrderHistoryProps {
  slug: string;
}

type OrderStatus =
  | "processing"
  | "completed"
  | "cancelled"
  | "payment_requested"
  | "paid";
type PrintFilter = "paid" | "cancelled" | "both";

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
                {o.items.map((item: any) => (
                  <li key={item._id}>
                    {item.quantity}x {item.name}
                  </li>
                ))}
              </ul>
              <p>
                <strong>Total:</strong>{" "}
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(o.totalAmount || 0)}
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

  // --- MOBILE: carrossel (mantido) ---
  const sliderRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [printFilter, setPrintFilter] = useState<PrintFilter>("both");

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

  // --- IMPRESSÃO ---
  const printOrders = () => {
    const statuses: OrderStatus[] =
      printFilter === "both"
        ? (["paid", "cancelled"] as OrderStatus[])
        : ([printFilter] as OrderStatus[]);

    const ordersToPrint = order.filter((o) =>
      statuses.includes(o.status as OrderStatus),
    );
    const win = window.open("", "_blank");
    if (!win) return;

    const sectionLabel =
      printFilter === "both"
        ? "Pagos + Cancelados"
        : printFilter === "paid"
          ? "Pagos"
          : "Cancelados";

    win.document.write(`
      <html>
        <head>
          <title>Pedidos — ${sectionLabel}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
            .header { display:flex; align-items:center; justify-content:space-between; margin-bottom: 12px; }
            .header h1 { margin: 0; font-size: 18px; }
            .grid { display:grid; grid-template-columns: 1fr; gap: 12px; }
            .card { border:1px solid #e5e5e5; border-radius:8px; padding:12px; }
            .title { display:flex; justify-content:space-between; margin-bottom:6px; }
            .status { font-weight:600; }
            .items { margin:6px 0 8px 16px; }
            .meta { font-size:12px; color:#555; margin-top:6px; }
            button { padding:6px 10px; border-radius:6px; border:1px solid #ddd; background:#f7f7f7; cursor:pointer; }
            @media print { button { display:none; } .grid { grid-template-columns: repeat(2, 1fr); } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Pedidos — ${sectionLabel}</h1>
            <button onclick="window.print()">Imprimir</button>
          </div>
          <div class="grid">
    `);

    const fmtBRL = (n: number) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(n || 0);

    ordersToPrint.forEach((o: any) => {
      const itemsHtml = o.items
        .map((it: any) => `<li>${it.quantity}x ${it.name}</li>`)
        .join("");
      const statusText = StatusTexts[o.status as OrderStatus] || o.status;
      const obs = o.meta?.observations
        ? `<div class="meta"><strong>Obs.:</strong> ${o.meta.observations}</div>`
        : "";
      const type = o.meta?.orderType
        ? `<div class="meta"><strong>Tipo:</strong> ${o.meta.orderType === "local" ? "Local" : "Para Viagem"}</div>`
        : "";
      const split =
        o.meta?.splitCount && o.meta.splitCount > 1
          ? `<div class="meta"><strong>Divisão:</strong> ${o.meta.splitCount} pessoas</div>`
          : "";

      win.document.write(`
        <div class="card">
          <div class="title">
            <div><strong>Mesa ${o.meta?.tableId ?? ""}</strong></div>
            <div class="status">${statusText}</div>
          </div>
          <div><strong>Cliente:</strong> ${o.guestInfo?.name || "Anônimo"}</div>
          <div><strong>Itens:</strong><ul class="items">${itemsHtml}</ul></div>
          <div><strong>Total:</strong> ${fmtBRL(o.totalAmount)}</div>
          ${obs}${type}${split}
        </div>
      `);
    });

    win.document.write(`</div></body></html>`);
    win.document.close();
  };

  // --- PDF (NOVO) ---
  const downloadOrdersPdf = async () => {
    const statuses: OrderStatus[] =
      printFilter === "both"
        ? (["paid", "cancelled"] as OrderStatus[])
        : ([printFilter] as OrderStatus[]);

    const ordersToPrint = order.filter((o) =>
      statuses.includes(o.status as OrderStatus),
    );
    if (!ordersToPrint.length) return;

    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const margin = 12;
    const headerH = 10;
    const gap = 6;
    const cols = 2;
    const colW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
    const pad = 3;
    const lineH = 5;

    const sectionLabel =
      printFilter === "both"
        ? "Pagos + Cancelados"
        : printFilter === "paid"
          ? "Pagos"
          : "Cancelados";

    const drawHeader = () => {
      doc.setFontSize(14);
      doc.text(`Pedidos — ${sectionLabel}`, margin, margin + 6);
      doc.setFontSize(10);
      doc.text(
        `Gerado em ${new Date().toLocaleString()}`,
        pageW - margin,
        margin + 6,
        { align: "right" },
      );
    };

    drawHeader();

    // y de cada coluna (começam logo após o header)
    const yPos: number[] = Array(cols).fill(margin + headerH);
    let colIndex = 0;

    const split = (text: string, widthMm: number) =>
      doc.splitTextToSize(text, widthMm);

    for (const o of ordersToPrint) {
      const statusText = StatusTexts[o.status as OrderStatus] || o.status;
      const itemsLines = o.items.map((it: any) => `${it.quantity}x ${it.name}`);
      const clienteLines = split(
        `Cliente: ${o.guestInfo?.name || "Anônimo"}`,
        colW - pad * 2,
      );
      const totalLine = `Total: ${new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(o.totalAmount || 0)}`;

      const obsLines = o.meta?.observations
        ? split(`Obs.: ${o.meta.observations}`, colW - pad * 2)
        : [];
      const tipoLine = o.meta?.orderType
        ? `Tipo: ${o.meta.orderType === "local" ? "Local" : "Para Viagem"}`
        : "";
      const splitLine =
        o.meta?.splitCount && o.meta.splitCount > 1
          ? `Divisão: ${o.meta.splitCount} pessoas`
          : "";

      // calcular altura do card
      const linesCount =
        1 + // título
        clienteLines.length +
        1 + // "Itens:"
        itemsLines.length +
        1 + // total
        (obsLines.length ? obsLines.length : 0) +
        (tipoLine ? 1 : 0) +
        (splitLine ? 1 : 0);

      const cardH = pad * 2 + linesCount * lineH;

      // escolhe coluna; se não couber, troca; se ainda não couber, nova página
      let x = margin + colIndex * (colW + gap);
      let y = yPos[colIndex];

      if (y + cardH > pageH - margin) {
        colIndex = (colIndex + 1) % cols;
        x = margin + colIndex * (colW + gap);
        y = yPos[colIndex];

        if (y + cardH > pageH - margin) {
          doc.addPage();
          drawHeader();
          for (let i = 0; i < cols; i++) yPos[i] = margin + headerH;
          colIndex = 0;
          x = margin;
          y = yPos[0];
        }
      }

      // desenha card
      doc.setLineWidth(0.2);
      doc.roundedRect(x, y, colW, cardH, 2, 2);

      let cursorY = y + pad + 3;

      doc.setFontSize(12);
      doc.text(`Mesa ${o.meta?.tableId ?? ""}`, x + pad, cursorY);
      doc.setFontSize(10);
      doc.text(statusText, x + colW - pad, cursorY, { align: "right" });
      cursorY += lineH;

      doc.setFontSize(10);
      clienteLines.forEach((ln: any) => {
        doc.text(ln, x + pad, cursorY);
        cursorY += lineH;
      });

      doc.text("Itens:", x + pad, cursorY);
      cursorY += lineH;

      itemsLines.forEach((ln: any) => {
        doc.text(`• ${ln}`, x + pad + 2, cursorY);
        cursorY += lineH;
      });

      doc.text(totalLine, x + pad, cursorY);
      cursorY += lineH;

      obsLines.forEach((ln: any) => {
        doc.text(ln, x + pad, cursorY);
        cursorY += lineH;
      });

      if (tipoLine) {
        doc.text(tipoLine, x + pad, cursorY);
        cursorY += lineH;
      }
      if (splitLine) {
        doc.text(splitLine, x + pad, cursorY);
        cursorY += lineH;
      }

      // avança a coluna
      yPos[colIndex] = y + cardH + gap;
    }

    doc.save(`pedidos-${sectionLabel.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  };

  return (
    <div className="h-screen w-full bg-gray-50">
      <div className="mx-auto w-full p-2">
        {/* Barra de impressão / filtro */}
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Select
              value={printFilter}
              onValueChange={(v) => setPrintFilter(v as PrintFilter)}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Escolher filtro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Pedidos pagos</SelectItem>
                <SelectItem value="cancelled">Pedidos cancelados</SelectItem>
                <SelectItem value="both">Pagos + Cancelados</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={printOrders}
              className="gap-2"
              variant="outline"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button
              onClick={downloadOrdersPdf}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
          </div>
        </div>

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
