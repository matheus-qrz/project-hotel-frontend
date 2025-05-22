"use client"

import { useState } from 'react';
import { useAuthCheck } from '@/hooks/sessionManager';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useCartStore, useTableStore } from '@/stores';
import { extractIdFromSlug, extractNameFromSlug } from '@/utils/slugify';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function GuestLogin() {
    const { initializeGuest } = useCartStore();
    const { addGuest } = useTableStore();
    const { slug, tableId } = useParams();
    const [guestData, setGuestData] = useState({
        name: '',
    });
    const router = useRouter();
    const { authenticateAsGuest, isLoading, error } = useAuthCheck();


    const handleGuestEntry = (name: string) => {
        initializeGuest(name);
        const guestInfo = useCartStore.getState().guestInfo;
        if (guestInfo) {
            addGuest(guestInfo);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const restaurantName = slug && extractNameFromSlug(String(slug));
            const restaurantId = slug && extractIdFromSlug(String(slug));

            if (!tableId) {
                throw new Error('Número da mesa não encontrado.');
            }

            const result = await authenticateAsGuest(
                String(tableId),
                String(restaurantId),
                String(restaurantName),
                { name: guestData.name }
            );

            if (result.success) {
                handleGuestEntry(guestData.name);

                const guestInfo = useCartStore.getState().guestInfo;

                if (!guestInfo) {
                    throw new Error('Erro ao inicializar convidado.');
                }

                router.push(`/restaurant/${slug}/${tableId}/menu`);
            }
        } catch (err: any) {
            console.error('Erro no login como convidado:', err);
        }

        console.log("guestInfo saved: ", guestData)
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>
                        {error || 'Falha ao fazer login como convidado. Por favor, verifique suas informações.'}
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
                <Label htmlFor="name" className='text-md'>Nome</Label>
                <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Seu nome"
                    value={guestData.name}
                    onChange={(e) => setGuestData({ name: e.target.value })}
                    required
                />
            </div>

            <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !guestData.name.trim()}
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