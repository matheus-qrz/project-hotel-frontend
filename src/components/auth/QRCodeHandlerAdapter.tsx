"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { useSession } from "next-auth/react";

// API URL
const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export default function QRCodeHandler() {
  const router = useRouter();
  const { slug, tableId, unitId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: session, status } = useSession();
  const token = (session as any)?.token as string | undefined;

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
        const restaurantResponse = await fetch(
          `/${API_URL}/restaurant/by-slug/${slug}`,
        );
        if (!restaurantResponse.ok)
          throw new Error("Restaurante não encontrado");

        // Se tiver unitId, verificar se a unidade existe
        if (unitId) {
          const unitResponse = await fetch(`/${API_URL}/units/${unitId}`);
          if (!unitResponse.ok) throw new Error("Unidade não encontrada");
        }

        // Criar token de convidado com informação da unidade
        const guestToken = `guest_${Date.now()}_${unitId || "main"}_${Math.random().toString(36).substring(2, 15)}`;
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        token === guestToken;
        localStorage.setItem("guest_token", guestToken);

        // Redirecionar incluindo a unidade na URL se existir
        const redirectPath = unitId
          ? `/restaurant/${slug}/unit/${unitId}/${tableId}`
          : `/restaurant/${slug}/${tableId}`;

        router.push(redirectPath);
      } catch (error) {
        console.error("Erro ao processar QR code:", error);
        setError("QR code inválido ou unidade não encontrada.");
      } finally {
        setLoading(false);
      }
    };

    handleQRScan();
  }, [slug, tableId, unitId, router, token]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-gray-600">Processando QR Code...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="mb-2 text-xl font-semibold text-red-600">Erro</h2>
          <p className="mb-4 text-gray-700">{error}</p>
          <Button
            variant="secondary"
            onClick={() => router.push("/")}
            className="hover:bg-primary/90 rounded-md bg-primary px-4 py-2 text-white"
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
