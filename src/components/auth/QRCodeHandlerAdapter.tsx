'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuthStore } from '@/stores';

// API URL
const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;


export default function QRCodeHandler() {
    const router = useRouter();
    const { slug, tableId, unitId } = useParams();
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const handleQRScan = async () => {
            try {
                setLoading(true);

                // Salvar mesa e unidade no localStorage
                localStorage.setItem(`table-${slug}`, String(tableId));
                if (unitId) {
                    localStorage.setItem(`unit-${slug}`, String(unitId));
                }

                // Buscar informações do restaurante e unidade
                const restaurantResponse = await fetch(`/${API_URL}/restaurant/by-slug/${slug}`);
                if (!restaurantResponse.ok) throw new Error('Restaurante não encontrado');

                // Se tiver unitId, verificar se a unidade existe
                if (unitId) {
                    const unitResponse = await fetch(`/${API_URL}/units/${unitId}`);
                    if (!unitResponse.ok) throw new Error('Unidade não encontrada');
                }

                // Criar token de convidado com informação da unidade
                const guestToken = `guest_${Date.now()}_${unitId || 'main'}_${Math.random().toString(36).substring(2, 15)}`;
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                token === guestToken;
                localStorage.setItem('guest_token', guestToken);

                // Redirecionar incluindo a unidade na URL se existir
                const redirectPath = unitId
                    ? `/restaurant/${slug}/unit/${unitId}/${tableId}`
                    : `/restaurant/${slug}/${tableId}`;

                router.push(redirectPath);
            } catch (error) {
                console.error('Erro ao processar QR code:', error);
                setError('QR code inválido ou unidade não encontrada.');
            } finally {
                setLoading(false);
            }
        };

        handleQRScan();
    }, [slug, tableId, unitId, router, token]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-lg text-gray-600">Processando QR Code...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                    <h2 className="text-xl font-semibold text-red-600 mb-2">Erro</h2>
                    <p className="text-gray-700 mb-4">{error}</p>
                    <Button
                        variant="secondary"
                        onClick={() => router.push('/')}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                    >
                        Voltar à página inicial
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-16 text-center">
            <p>Redirecionando para a mesa {tableId}...</p>
        </div>
    );
}