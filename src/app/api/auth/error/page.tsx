// app/api/auth/error/page.tsx  (ou mova para /auth/error, ver nota no fim)
import Link from "next/link";

type Search = { error?: string };

function mapError(code?: string) {
  switch (code) {
    case "Configuration":
      return {
        title: "Configuração inválida",
        msg: "Verifique as credenciais do provedor.",
      };
    case "AccessDenied":
      return { title: "Acesso negado", msg: "Sua conta não tem permissão." };
    case "Verification":
      return { title: "Link inválido/expirado", msg: "Solicite um novo link." };
    default:
      return { title: "Falha na autenticação", msg: "Tente novamente." };
  }
}

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { error } = await searchParams;
  const { title, msg } = mapError(error);

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-muted-foreground">{msg}</p>
      <div className="mt-6">
        <Link
          href="/login"
          className="underline"
        >
          Voltar ao login
        </Link>
      </div>
    </main>
  );
}
