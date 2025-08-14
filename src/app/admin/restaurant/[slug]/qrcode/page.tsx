'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Printer } from 'lucide-react';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
import Header from '@/components/header/Header';
import { Sidebar } from '@/components/dashboard/SideMenu';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { useParams } from 'next/navigation';
import { extractIdFromSlug, extractNameFromSlug } from '@/utils/slugify';


export default function QRCodeGenerator() {
    const { slug } = useParams();
    const [numTables, setNumTables] = useState(1);
    const [baseDomain, setBaseDomain] = useState('https://seugarcom.service.com/');
    const [qrCodes, setQrCodes] = useState<string[]>([]);
    const [qrSize, setQrSize] = useState(200);
    const { isOpen } = useSidebar();

    const restaurantId = slug && extractIdFromSlug(String(slug));
    const restaurantName = slug && extractNameFromSlug(String(slug));



    // Gerar QR Codes para todas as mesas
    const generateQRCodes = () => {
        const codes = [];
        for (let i = 1; i <= numTables; i++) {
            codes.push(`${baseDomain}/qrcode/${restaurantId}/${i}`);
        }
        setQrCodes(codes);
    };

    // Função para baixar QR Code individual
    const downloadQRCode = async (url: string, tableNumber: number) => {
        const qrCodeElement = document.getElementById(`qr-${tableNumber}`);
        if (!qrCodeElement) return;

        try {
            const dataUrl = await toPng(qrCodeElement, {
                quality: 1.0,
                width: qrSize,
                height: qrSize
            });

            const link = document.createElement('a');
            link.download = `qrcode-mesa-${tableNumber}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Erro ao baixar QR Code:', error);
        }
    };

    // Função para imprimir todos os QR codes
    const printAllQRCodes = async () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const restaurantName = 'Seu Restaurante'; // Substituir pelo nome real

        // Aguardar todas as conversões de QR code para PNG
        const qrPromises = qrCodes.map(async (url, index) => {
            const qrElement = document.getElementById(`qr-${index + 1}`);
            if (!qrElement) return '';

            try {
                return await toPng(qrElement, {
                    quality: 1.0,
                    width: qrSize,
                    height: qrSize
                });
            } catch (error) {
                console.error('Erro ao converter QR code:', error);
                return '';
            }
        });

        const qrDataUrls = await Promise.all(qrPromises);

        printWindow.document.write(`
            <html>
                <head>
                    <title>QR Codes - ${restaurantName}</title>
                    <style>
                        /* ... seus estilos ... */
                    </style>
                </head>
                <body>
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1>${restaurantName} - QR Codes</h1>
                        <button onclick="window.print()">Imprimir QR Codes</button>
                    </div>
                    <div>
        `);

        qrDataUrls.forEach((dataUrl, index) => {
            const tableNumber = index + 1;
            printWindow.document.write(`
                <div class="qr-wrapper">
                    <div class="restaurant-name">${restaurantName}</div>
                    <div class="table-number">Mesa ${tableNumber}</div>
                    <img src="${dataUrl}" width="${qrSize}" height="${qrSize}" />
                    <div class="instructions">Escaneie o QR Code para fazer seu pedido</div>
                </div>
            `);
        });

        printWindow.document.write(`
                    </div>
                </body>
            </html>
        `);

        printWindow.document.close();
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />

            <div className="flex flex-col flex-1 h-screen overflow-auto">
                <Header />

                <main className={cn(
                    "flex-1 transition-all duration-300 bg-gray-50",
                    isOpen ? "ml-64" : "ml-0"
                )}>
                    <div className="flex justify-center items-start min-h-full py-8">
                        <div className="w-full max-w-2xl px-4">
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h1 className="text-2xl font-semibold text-center mb-8">
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

                                            <div className="flex flex-row w-full items-center justify-between gap-4">
                                                <div className="w-4/5">
                                                    <Label className="text-sm font-medium">
                                                        Número de Mesas
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={numTables}
                                                        onChange={(e) => setNumTables(parseInt(e.target.value) || 1)}
                                                        className="mt-1"
                                                    />
                                                </div>

                                                <div>
                                                    <Label className="text-sm font-medium">
                                                        Tamanho
                                                    </Label>
                                                    <Select
                                                        value={qrSize.toString()}
                                                        onValueChange={(value) => setQrSize(parseInt(value))}
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
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-lg font-medium">
                                                QR Codes Gerados
                                            </h2>
                                            <Button
                                                onClick={printAllQRCodes}
                                                variant="outline"
                                                size="sm"
                                            >
                                                <Printer className="w-4 h-4 mr-2" />
                                                Imprimir Todos
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {qrCodes.map((url, index) => (
                                                <Card key={index} className="overflow-hidden">
                                                    <CardContent className="p-4 text-center">
                                                        <h3 className="font-medium mb-3">
                                                            Mesa {index + 1}
                                                        </h3>
                                                        <div className="flex justify-center mb-4">
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
                                                            <Download className="w-4 h-4 mr-2" />
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

