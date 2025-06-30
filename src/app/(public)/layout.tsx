import RootLayout from "@/layout";
import "../globals.css";

export const metadata = {
    title: "Seu Garçom",
    description: "Frontend",
};

export default function PublicLayout({
    children,
    params
}: {
    children: React.ReactNode,
    params: { locale: string }
}) {
    return (
        <RootLayout params={params}>
            {children}
        </RootLayout>
    );
}