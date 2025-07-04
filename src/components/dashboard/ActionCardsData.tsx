// data/actionCards.tsx
import { UserCog2, Store, QrCode, Menu, Percent, BarChart3 } from 'lucide-react';
import { ActionCard } from './types';

export const createActionCards = (slug: string): ActionCard[] => [
    {
        id: 'employees',
        title: 'Gerenciar funcionários',
        description: 'Gerencie seus funcionários de forma rápida e prática',
        icon: <UserCog2 className="h-6 w-6 text-white" />,
        iconBgColor: 'bg-green-500',
        path: `/admin/restaurant/${slug}/employees`,
        clickCount: 0
    },
    {
        id: 'units',
        title: 'Unidades',
        description: 'Gerencie todas as unidades do seu restaurante',
        icon: <Store className="h-6 w-6 text-white" />,
        iconBgColor: 'bg-purple-500',
        path: `/admin/restaurant/${slug}/units`,
        clickCount: 0
    },
    {
        id: 'qrcode',
        title: 'QR-Code',
        description: 'Gere e gerencie QR codes para suas mesas',
        icon: <QrCode className="h-6 w-6 text-white" />,
        iconBgColor: 'bg-blue-500',
        path: `/admin/restaurant/${slug}/qrcode`,
        clickCount: 0
    },
    {
        id: 'menu',
        title: 'Menu',
        description: 'Gerencie o cardápio do seu restaurante',
        icon: <Menu className="h-6 w-6 text-white" />,
        iconBgColor: 'bg-yellow-500',
        path: `/admin/restaurant/${slug}/products`,
        clickCount: 0
    },
    {
        id: 'promotions',
        title: 'Promoções',
        description: 'Gerencie as promoções do seu restaurante',
        icon: <Percent className="h-6 w-6 text-white" />,
        iconBgColor: 'bg-orange-500',
        path: `/admin/restaurant/${slug}/promotions`,
        clickCount: 0
    },
    {
        id: 'statistics',
        title: 'Estatísticas',
        description: 'Visualize estatísticas detalhadas do seu negócio',
        icon: <BarChart3 className="h-6 w-6 text-white" />,
        iconBgColor: 'bg-cyan-500',
        path: `/admin/restaurant/${slug}/statistics`,
        clickCount: 0
    }
];