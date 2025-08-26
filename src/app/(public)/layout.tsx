import QueryProvider from "@/providers/queryProvider";
import "../globals.css";

export const metadata = {
  title: "Seu Garçom",
  description: "Frontend",
};

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  return (
    <html lang={locale ?? "pt-BR"}>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
