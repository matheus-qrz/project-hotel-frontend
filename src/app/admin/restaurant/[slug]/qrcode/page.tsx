"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Printer } from "lucide-react";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import Header from "@/components/header/Header";
import { Sidebar } from "@/components/dashboard/SideMenu";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { useParams } from "next/navigation";
import { extractIdFromSlug, extractNameFromSlug } from "@/utils/slugify";

export default function QRCodeGenerator() {
  const { slug } = useParams();
  const [numTables, setNumTables] = useState(1);
  const [baseDomain, setBaseDomain] = useState(
    `https://seugarcom-frontend.vercel.app/restaurant/${slug}`,
  );
  const [qrCodes, setQrCodes] = useState<string[]>([]);
  const [qrSize, setQrSize] = useState(200);
  const { isOpen } = useSidebar();

  const restaurantId = slug && extractIdFromSlug(String(slug));
  const restaurantName =
    (slug && extractNameFromSlug(String(slug))) || "Restaurante";

  // Gera QR Codes para todas as mesas
  const generateQRCodes = () => {
    const cleanBase = String(baseDomain).replace(/\/+$/, ""); // remove barra final
    const codes: string[] = [];
    for (let i = 1; i <= numTables; i++) {
      // ajuste conforme sua rota real
      codes.push(`${cleanBase}/qrcode/${restaurantId}/${i}`);
    }
    setQrCodes(codes);
  };

  // Baixar QR individual (mantido)
  const downloadQRCode = async (_url: string, tableNumber: number) => {
    const qrCodeElement = document.getElementById(`qr-${tableNumber}`);
    if (!qrCodeElement) return;
    try {
      const dataUrl = await toPng(qrCodeElement, {
        quality: 1.0,
        width: qrSize,
        height: qrSize,
      });
      const link = document.createElement("a");
      link.download = `qrcode-mesa-${tableNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Erro ao baixar QR Code:", error);
    }
  };

  // Imprimir todos (mantido)
  const printAllQRCodes = async () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // converte cada QR para imagem PNG
    const qrPromises = qrCodes.map(async (_url, index) => {
      const el = document.getElementById(`qr-${index + 1}`);
      if (!el) return "";
      try {
        return await toPng(el, { quality: 1.0, width: qrSize, height: qrSize });
      } catch (e) {
        console.error("Erro ao converter QR:", e);
        return "";
      }
    });

    const qrDataUrls = await Promise.all(qrPromises);

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Codes - ${restaurantName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
            .qr-wrapper { border: 1px solid #eee; padding: 12px; text-align: center; border-radius: 8px; }
            .restaurant-name { font-weight: 600; margin-bottom: 4px; }
            .table-number { font-size: 14px; margin: 6px 0 10px; }
            @media print {
              button { display: none; }
              .grid { grid-template-columns: repeat(3, 1fr); } /* mais colunas no papel */
            }
          </style>
        </head>
        <body>
          <div style="text-align:center; margin-bottom: 12px;">
            <h1 style="margin:0 0 8px;">${restaurantName} - QR Codes</h1>
            <button onclick="window.print()">Imprimir QR Codes</button>
          </div>
          <div class="grid">
    `);

    qrDataUrls.forEach((dataUrl, index) => {
      const tableNumber = index + 1;
      printWindow!.document.write(`
        <div class="qr-wrapper">
          <div class="restaurant-name">${restaurantName}</div>
          <div class="table-number">Mesa ${tableNumber}</div>
          <img src="${dataUrl}" width="${qrSize}" height="${qrSize}" />
          <div style="font-size:12px; color:#555; margin-top:6px;">
            Escaneie para fazer seu pedido
          </div>
        </div>
      `);
    });

    printWindow.document.write(`</div></body></html>`);
    printWindow.document.close();
  };

  // Baixar TODOS em um PDF organizado (NOVO)
  const downloadAllQRCodesAsPDF = async () => {
    // converte todos os QRs para PNG primeiro
    const images = await Promise.all(
      qrCodes.map(async (_url, index) => {
        const el = document.getElementById(`qr-${index + 1}`);
        if (!el) return "";
        try {
          return await toPng(el, {
            quality: 1.0,
            width: qrSize,
            height: qrSize,
          });
        } catch {
          return "";
        }
      }),
    );

    // importa jsPDF apenas no client
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const margin = 12; // margem externa
    const headerH = 10; // altura do cabeçalho
    const gap = 6; // espaço entre cards
    const cols = 2; // 2 colunas
    const colW = (pageW - margin * 2 - gap * (cols - 1)) / cols;

    const qrSide = Math.min(colW * 0.9, 70); // lado do QR (mm)
    const labelH = 10; // espaço para "Mesa X" + domínio
    let x = margin;
    let y = margin + headerH;

    const drawHeader = () => {
      doc.setFontSize(14);
      doc.text(`${restaurantName} — QR Codes`, margin, margin + 6);
      doc.setFontSize(10);
      doc.text(
        `Gerado em ${new Date().toLocaleDateString()}`,
        pageW - margin,
        margin + 6,
        { align: "right" },
      );
    };

    drawHeader();

    let colIndex = 0;
    images.forEach((dataUrl, i) => {
      if (!dataUrl) return;

      // quebra de página se não couber
      if (y + qrSide + labelH > pageH - margin) {
        doc.addPage();
        drawHeader();
        y = margin + headerH;
        colIndex = 0;
      }

      x = margin + colIndex * (colW + gap);

      // centraliza o QR dentro da coluna
      const imgX = x + (colW - qrSide) / 2;
      doc.addImage(dataUrl, "PNG", imgX, y, qrSide, qrSide);

      // rótulos
      doc.setFontSize(12);
      doc.text(`Mesa ${i + 1}`, x + colW / 2, y + qrSide + 5, {
        align: "center",
      });

      doc.setFontSize(8);
      const cleanBase = String(baseDomain).replace(/\/+$/, "");
      doc.text(`${cleanBase}`, x + colW / 2, y + qrSide + 9, {
        align: "center",
      });

      // próxima célula
      if (colIndex === cols - 1) {
        colIndex = 0;
        y += qrSide + labelH + gap;
      } else {
        colIndex++;
      }
    });

    doc.save(`qrcodes-${restaurantName}.pdf`);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex h-screen flex-1 flex-col overflow-auto">
        <Header />

        <main
          className={cn(
            "flex-1 bg-gray-50 transition-all duration-300",
            isOpen ? "ml-64" : "ml-0",
          )}
        >
          <div className="flex min-h-full items-start justify-center py-8">
            <div className="w-full max-w-2xl px-4">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h1 className="mb-8 text-center text-2xl font-semibold">
                  Gerar QR Codes para Mesas
                </h1>

                <Card className="mb-8">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm font-medium">
                          Domínio Base
                        </Label>
                        <Input
                          value={baseDomain}
                          onChange={(e) => setBaseDomain(e.target.value)}
                          placeholder={`${baseDomain}${restaurantName}/`}
                          className="mt-1"
                        />
                      </div>

                      <div className="flex w-full flex-col gap-4 sm:flex-row">
                        <div className="sm:w-4/5">
                          <Label className="text-sm font-medium">
                            Número de Mesas
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            value={numTables}
                            onChange={(e) =>
                              setNumTables(parseInt(e.target.value) || 1)
                            }
                            className="mt-1"
                          />
                        </div>

                        <div className="sm:w-1/5">
                          <Label className="text-sm font-medium">Tamanho</Label>
                          <Select
                            value={qrSize.toString()}
                            onValueChange={(v) => setQrSize(parseInt(v))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="150">Pequeno</SelectItem>
                              <SelectItem value="200">Médio</SelectItem>
                              <SelectItem value="250">Grande</SelectItem>
                              <SelectItem value="300">Muito Grande</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button
                        onClick={generateQRCodes}
                        className="w-full"
                      >
                        Gerar QR Codes
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {qrCodes.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-center">
                      <h2 className="text-lg font-medium">QR Codes Gerados</h2>
                      <div className="flex gap-2 self-end">
                        <Button
                          onClick={printAllQRCodes}
                          variant="outline"
                          size="sm"
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Imprimir Todos
                        </Button>
                        <Button
                          onClick={downloadAllQRCodesAsPDF}
                          size="sm"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Baixar PDF
                        </Button>
                      </div>
                    </div>

                    {/* 1 coluna no mobile, 2 no desktop */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {qrCodes.map((url, index) => (
                        <Card
                          key={index}
                          className="overflow-hidden"
                        >
                          <CardContent className="p-4 text-center">
                            <h3 className="mb-3 font-medium">
                              Mesa {index + 1}
                            </h3>
                            <div className="mb-4 flex justify-center">
                              <div id={`qr-${index + 1}`}>
                                <QRCodeSVG
                                  value={url}
                                  size={qrSize}
                                  level="H"
                                />
                              </div>
                            </div>
                            <Button
                              onClick={() => downloadQRCode(url, index + 1)}
                              variant="outline"
                              size="sm"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Baixar
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
