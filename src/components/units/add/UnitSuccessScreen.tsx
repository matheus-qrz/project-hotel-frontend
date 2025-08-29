export default function UnitSuccessScreen() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500">
        {/* ícone ok */}
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 6L9 17L4 12"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2 className="mb-3 text-xl font-medium sm:text-2xl">
        Unidade criada com sucesso
      </h2>

      <p className="mx-auto max-w-prose text-sm text-gray-600 sm:text-base">
        Agora você pode gerenciar sua unidade de forma completa e eficiente.
        Através do sistema, é possível visualizar estatísticas detalhadas de
        desempenho, criar e atualizar o cardápio, adicionar e gerenciar
        funcionários, além de ajustar o horário de funcionamento conforme
        necessário.
      </p>
    </div>
  );
}
