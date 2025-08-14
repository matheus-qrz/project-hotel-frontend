import "@/app/globals.css";
import { Inter } from "next/font/google";
import { ReactNode } from "react";
import Providers from "./providers/providers";
import { ToastProvider } from "./components/toast/toastContext";
import { Toaster } from "./components/toast/toaster";
import { ThemeProvider } from "./components/theme_provider";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata = {
    title: "Seu Garçom",
    description: "Frontend",
};

interface RootLayoutProps {
    children: ReactNode;
    params?: {
        locale?: string;
    };
}

export default function RootLayout({ children, params }: RootLayoutProps) {
    const locale = params?.locale || "pt-BR";

    return (
        <html lang={locale} className="light" suppressHydrationWarning>
            <body className={inter.variable} suppressHydrationWarning>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem={false}
                    disableTransitionOnChange
                >
                    <ToastProvider>
                        {children}
                        <Toaster />
                    </ToastProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}