'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, Camera, ArrowLeft } from 'lucide-react';

interface ScanClientProps {
    restaurantName: string;
    restaurantId: string;
    tableId: number;
}

export default function ScanClient({ restaurantName, tableId }: ScanClientProps) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [scanMode, setScanMode] = useState<'manual' | 'camera'>('manual');

    // Função para validar e salvar o número da mesa
    const saveTableNumber = () => {
        if (!tableId) {
            setError('Por favor, informe o número da mesa');
            return;
        }

        if (isNaN(Number(tableId)) || Number(tableId) <= 0) {
            setError('Por favor, informe um número de mesa válido');
            return;
        }

        // Salvar no localStorage
        localStorage.setItem(`table-${restaurantName}`, String(tableId));

        // Redirecionar para o menu
        router.push(`/${restaurantName}/menu`);
    };

    // Função para voltar à página do restaurante
    const goBack = () => {
        router.push(`/${restaurantName}`);
    };

    // Este é um exemplo simplificado. Em uma implementação real,
    // você usaria uma biblioteca como react-qr-reader para escanear QR codes.
    const toggleScanMode = () => {
        setScanMode(scanMode === 'manual' ? 'camera' : 'manual');
    };

    return (
        <div className="container mx-auto px-4 py-6 max-w-md flex flex-col items-center min-h-[80vh]">
            <div className="w-full flex items-center mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    className="mr-2"
                    onClick={goBack}
                >
                    <ArrowLeft />
                </Button>
                <h1 className="text-xl font-bold">Informar mesa</h1>
            </div>

            <div className="bg-gray-50 p-8 rounded-lg w-full mb-8 text-center">
                <div className="mb-6">
                    <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
                        {scanMode === 'manual' ? (
                            <QrCode size={40} className="text-primary" />
                        ) : (
                            <Camera size={40} className="text-primary" />
                        )}
                    </div>
                    <h2 className="text-lg font-medium mb-2">
                        {scanMode === 'manual' ? 'Número da mesa' : 'Escanear QR Code'}
                    </h2>
                    <p className="text-gray-600 text-sm">
                        {scanMode === 'manual'
                            ? 'Informe o número da mesa para fazer seu pedido'
                            : 'Posicione a câmera em frente ao QR Code da mesa'
                        }
                    </p>
                </div>

                {scanMode === 'manual' ? (
                    <>
                        <div className="mb-4">
                            <Input
                                type="number"
                                placeholder="Número da mesa"
                                value={tableId}
                                onChange={(e) => {
                                    setError(null);
                                }}
                                className="text-center text-xl font-bold h-12"
                                min="1"
                            />
                            {error && (
                                <p className="text-red-500 text-sm mt-2">{error}</p>
                            )}
                        </div>

                        <Button
                            onClick={saveTableNumber}
                            className="w-full mb-4"
                        >
                            Confirmar Mesa
                        </Button>
                    </>
                ) : (
                    <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center h-52">
                        <p className="text-gray-500">
                            Funcionalidade de câmera não disponível nesta demonstração
                        </p>
                    </div>
                )}

                <Button
                    variant="outline"
                    onClick={toggleScanMode}
                    className="w-full"
                >
                    {scanMode === 'manual'
                        ? 'Escanear QR Code com câmera'
                        : 'Informar número manualmente'
                    }
                </Button>
            </div>
        </div>
    );
}