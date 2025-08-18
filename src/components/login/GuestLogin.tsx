'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { extractIdFromSlug } from '@/utils/slugify';
import { generateOrGetGuestId } from '@/utils/guestId';
import { useGuestStore } from '@/stores/auth';

export function GuestLogin() {
    const { slug, tableId } = useParams();
    const router = useRouter();

    const [guestName, setGuestName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const {
        setGuestInfo,
        setTableId,
        setRestaurantId,
        setSessionId,
    } = useGuestStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestName.trim()) return;

        try {
            setIsLoading(true);
            setError('');

            const guestId = generateOrGetGuestId();
            const joinedAt = new Date().toISOString();

            const restaurantId = slug && extractIdFromSlug(String(slug));

            if (!restaurantId || !tableId || !guestId) {
                throw new Error("Restaurante, mesa ou convidado inválidos.");
            }

            const guestInfo = { id: String(guestId), name: guestName, joinedAt };
            const sessionToken = btoa(`${guestId}:${tableId}:${Date.now()}`);

            // Salvar na store
            setGuestInfo(guestInfo);
            setTableId(Number(tableId));
            setRestaurantId(String(restaurantId));
            setSessionId(sessionToken); // útil para identificar sessão de pedido

            router.push(`/restaurant/${slug}/${tableId}/menu`);
        } catch (err: any) {
            console.error("Erro no login como convidado:", err);
            setError("Erro ao identificar-se como convidado.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
                <Label htmlFor="name" className="text-md">Nome</Label>
                <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Seu nome"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                />
            </div>

            <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !guestName.trim()}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                    </>
                ) : (
                    'Continuar'
                )}
            </Button>

            <p className="text-sm text-center text-gray-500 mt-2">
                Suas informações serão usadas apenas para identificação durante sua visita.
            </p>
        </form>
    );
}
