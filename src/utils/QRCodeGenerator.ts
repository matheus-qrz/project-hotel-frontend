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

// 🔹 NOVO: usa o util leve (gera imagens sem capturar DOM)
import { buildQrPdf, openPrintWindow } from "@/utils/QRCodeGenerator";

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

  // Gera QR Codes para todas as mesas (mantido)
  const generateQRCodes = () => {
    const cleanBase = String(baseDomain).replace(/\/+$/, ""); // remove barra final
    const codes: string[] = [];
    for (let i = 1; i <= numTables; i++) {
      // ajuste conforme sua rota real
      codes.push(`${cleanBase}/${i}`);
    }
    setQrCodes(codes);
  };

  // Baixar QR individual (mantido, mas com pixelRatio: 1 para mobile)
  const downloadQRCode = async (_url: string, tableNumber: number) => {
    const qrCodeElement = document.getElementById(`qr-${tableNumber}`);
    if (!qrCodeElement) return;
    try {
      const dataUrl = await toPng(qrCodeElement, {
        quality: 1.0,
        width: qrSize,
        height: qrSize,
        pixelRatio: 1, // 🔹 evita explosão de memória no celular
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `qrcode-mesa-${tableNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Erro ao baixar QR Code:", error);
    }
  };

  // Imprimir todos — agora usando openPrintWindow (sem capturar DOM)
  const printAllQRCodes = async () => {
    if (!qrCodes.length) return;
    const items = qrCodes.map((url, index) => ({
      label: `Mesa ${index + 1}`,
      url,
    }));
    await openPrintWindow(items, {
      title: `${restaurantName} - QR Codes`,
      qrSizePx: Math.min(300, Math.max(160, qrSize)),
    });
  };

  // Baixar TODOS em um PDF organizado — agora usando buildQrPdf (sem DOM)
  const downloadAllQRCodesAsPDF = async () => {
    if (!qrCodes.length) return;

    const items = qrCodes.map((url, index) => ({
      label: `Mesa ${index + 1}`,
      url,
    }));

    const filename = `qrcodes-${restaurantName}-${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`;

    await buildQrPdf(items, {
      restaurantName: restaurantName || "Restaurante",
      filename,
      cols: 3, // grade A4
      rows: 4,
      showBaseUrl: true,
      baseUrl: String(baseDomain).replace(/\/+$/, ""),
    });
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

                      <Button onClick={generateQRCodes} className="w-full">
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
                        <Button onClick={printAllQRCodes} variant="outline" size="sm">
                          <Printer className="mr-2 h-4 w-4" />
                          Imprimir Todos
                        </Button>
                        <Button onClick={downloadAllQRCodesAsPDF} size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Baixar PDF
                        </Button>
                      </div>
                    </div>

                    {/* 1 coluna no mobile, 2 no desktop */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {qrCodes.map((url, index) => (
                        <Card key={index} className="overflow-hidden">
                          <CardContent className="p-4 text-center">
                            <h3 className="mb-3 font-medium">Mesa {index + 1}</h3>
                            <div className="mb-4 flex justify-center">
                              <div id={`qr-${index + 1}`}>
                                <QRCodeSVG value={url} size={qrSize} level="H" />
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
