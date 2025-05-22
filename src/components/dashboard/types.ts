// types/ActionCard.ts
export interface ActionCard {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    iconBgColor: string;
    path: string;
    clickCount: number;
}