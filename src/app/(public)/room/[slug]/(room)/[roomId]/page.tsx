"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useHotelStore } from "@/stores/hotel";
import { DelayedLoading } from "@/components/loading/DelayedLoading";
import { Button } from "@/components/ui/button";
import {
  UtensilsCrossed,
  Wine,
  WashingMachine,
  Sparkles,
  ConciergeBell,
  Waves,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

/* ─── Mapa de ícones (lucide-react) ─── */
const serviceIconMap: Record<string, React.ReactNode> = {
  restaurant: <UtensilsCrossed className="h-7 w-7" />,
  bar: <Wine className="h-7 w-7" />,
  laundry: <WashingMachine className="h-7 w-7" />,
  spa: <Sparkles className="h-7 w-7" />,
  roomservice: <ConciergeBell className="h-7 w-7" />,
  pool: <Waves className="h-7 w-7" />,
};

/* ─── Tipagem ─── */
interface RoomService {
  id: string;
  name: string;
  icon: string;
  description: string;
  available: boolean;
}

export default function RoomIdentificationPage() {
  const { slug, roomId } = useParams();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { hotel, isLoading, fetchHotelData, getActiveRooms } = useHotelStore();

  // TODO: substituir por dados reais vindos da API do hotel
  const services: RoomService[] = [
    {
      id: "1",
      name: "Restaurante",
      icon: "restaurant",
      description: "Cardápio completo",
      available: true,
    },
    {
      id: "2",
      name: "Bar",
      icon: "bar",
      description: "Drinks & petiscos",
      available: true,
    },
    {
      id: "3",
      name: "Lavanderia",
      icon: "laundry",
      description: "Lavagem & passadoria",
      available: true,
    },
    {
      id: "4",
      name: "Room Service",
      icon: "roomservice",
      description: "Entrega no quarto",
      available: true,
    },
    {
      id: "5",
      name: "Piscina",
      icon: "pool",
      description: "Reserva de espreguiçadeiras",
      available: true,
    },
    {
      id: "6",
      name: "Spa",
      icon: "spa",
      description: "Massagens & tratamentos",
      available: false,
    },
  ];

  /* ─── Inicialização ─── */
  useEffect(() => {
    const initializeData = async () => {
      if (!slug || !roomId) {
        setError("Parâmetros inválidos");
        return;
      }

      try {
        await fetchHotelData(String(slug));
      } catch (err: any) {
        console.error("Erro ao carregar dados:", err);
        setError(err.message || "Erro ao carregar informações do hotel.");
      }
    };

    initializeData();
  }, [slug, roomId, fetchHotelData]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  /* ─── Validação do quarto ─── */
  const currentRoom = getActiveRooms().find(
    (room: any) => room.roomId === String(roomId),
  );

  /* ─── Helpers ─── */
  const greeting =
    currentTime.getHours() < 12
      ? "Bom dia"
      : currentTime.getHours() < 18
        ? "Boa tarde"
        : "Boa noite";

  const availableServices = services.filter((s) => s.available);
  const unavailableServices = services.filter((s) => !s.available);
  const allServices = [...availableServices, ...unavailableServices];

  const handleServiceClick = (service: RoomService) => {
    if (!service.available || !slug) return;
    router.push(`/room/${slug}/${roomId}/service/${service.id}`);
  };

  /* ─── Loading ─── */
  if (isLoading) {
    return <DelayedLoading />;
  }

  /* ─── Erro ─── */
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0C0C0C] px-4">
        <h1 className="mb-2 font-serif text-xl font-bold text-[#C8A97E]">
          Erro
        </h1>
        <p className="mb-6 text-center text-sm text-[#8B7355]">{error}</p>
        <Button
          onClick={() => router.push("/")}
          variant="outline"
          className="rounded-full border-[#C8A97E]/30 bg-transparent text-[#C8A97E] hover:bg-[#C8A97E]/10"
        >
          Voltar à Página Inicial
        </Button>
      </div>
    );
  }

  /* ─── Quarto não encontrado ─── */
  if (hotel && !currentRoom) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0C0C0C] px-4">
        <h1 className="mb-2 font-serif text-xl font-bold text-[#C8A97E]">
          Quarto não encontrado
        </h1>
        <p className="mb-6 text-center text-sm text-[#8B7355]">
          O quarto {roomId} não está disponível ou não existe.
        </p>
        <Button
          onClick={() => router.push("/")}
          variant="outline"
          className="rounded-full border-[#C8A97E]/30 bg-transparent text-[#C8A97E] hover:bg-[#C8A97E]/10"
        >
          Voltar à Página Inicial
        </Button>
      </div>
    );
  }

  /* ─── Tela principal ─── */
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0C0C0C] font-serif">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed left-1/2 top-[-50%] z-0 h-[60%] w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(200,169,126,0.03)_0%,transparent_70%)]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* ═══ Header — Seu Garçom Rooms ═══ */}
        <header className="flex items-center justify-center gap-3 border-b border-[#C8A97E]/15 bg-black px-6 py-3.5">
          <Image
            src="/Logo_circular_sem_nome.png"
            alt="Seu Garçom"
            width={32}
            height={32}
            className="rounded-full object-cover"
          />
          <div className="flex items-baseline">
            <span className="font-serif text-[15px] font-semibold uppercase tracking-[4px] text-[#C8A97E]">
              Seu Garçom
            </span>
            <span className="ml-2.5 border-l border-[#C8A97E]/30 pl-2.5 font-sans text-[9px] font-light uppercase tracking-[3px] text-[#8B7355]">
              Rooms
            </span>
          </div>
        </header>

        {/* ═══ Hotel info + Quarto ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="px-6 pb-5 pt-8 text-center"
        >
          {/* Logo do hotel */}
          <div className="from-[#C8A97E]/12 to-[#C8A97E]/4 mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full border border-[#C8A97E]/20 bg-gradient-to-br">
            {hotel?.logo ? (
              <Image
                src={hotel.logo}
                alt={hotel.name}
                width={72}
                height={72}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-serif text-2xl font-semibold text-[#C8A97E]">
                {hotel?.name?.charAt(0) || "H"}
              </span>
            )}
          </div>

          <h1 className="mb-1.5 font-serif text-[22px] font-medium tracking-wide text-[#E8DDD0]">
            {hotel?.name || "Carregando..."}
          </h1>

          <p className="font-sans text-[13px] font-light uppercase tracking-[1.5px] text-[#8B7355]">
            {greeting}
          </p>

          {/* Pill do quarto */}
          <div className="bg-[#C8A97E]/8 mt-5 inline-flex items-center gap-2 rounded-full border border-[#C8A97E]/20 px-7 py-2.5">
            <span className="font-sans text-[10px] font-normal uppercase tracking-[3px] text-[#8B7355]">
              {currentRoom?.displayName ? "Quarto" : "Quarto"}
            </span>
            <span className="font-serif text-[26px] font-semibold leading-none text-[#C8A97E]">
              {currentRoom?.displayName || roomId}
            </span>
          </div>
        </motion.section>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mx-auto mb-6 h-px w-10 bg-[#C8A97E]/25"
        />

        {/* ═══ Serviços ═══ */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-5 text-center font-sans text-[10px] font-normal uppercase tracking-[3px] text-[#6B5E4E]"
        >
          Serviços disponíveis
        </motion.p>

        <div className="mx-auto grid max-w-[440px] grid-cols-2 gap-3 px-5 pb-8">
          {allServices.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.3 + i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              onClick={() => handleServiceClick(service)}
              className={`duration-400 group relative cursor-pointer overflow-hidden rounded-2xl border border-[#C8A97E]/10 bg-white/[0.03] p-6 text-center transition-all hover:border-[#C8A97E]/30 hover:bg-white/[0.05] active:scale-[0.97] ${!service.available ? "pointer-events-none opacity-35" : ""} `}
            >
              {/* Glow on hover */}
              <div className="duration-400 pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(200,169,126,0.06)_0%,transparent_70%)] opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="relative">
                <div className="mb-3 flex items-center justify-center text-[#C8A97E] transition-transform duration-300 group-hover:scale-110">
                  {serviceIconMap[service.icon] || serviceIconMap.restaurant}
                </div>
                <div className="mb-1 font-serif text-[17px] font-semibold tracking-wide text-[#E8DDD0]">
                  {service.name}
                </div>
                <div className="font-sans text-[11px] font-light tracking-wide text-[#6B5E4E]">
                  {service.description}
                </div>
                {!service.available && (
                  <div className="mt-2 font-sans text-[9px] font-normal uppercase tracking-wider text-[#5A4E3E]">
                    Indisponível
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ═══ Footer ═══ */}
        <footer className="border-[#C8A97E]/8 mt-auto border-t px-6 py-6 text-center">
          <p className="font-sans text-[10px] font-light uppercase tracking-[1.5px] text-[#4A3F33]">
            Powered by Seu Garçom Rooms
          </p>
        </footer>
      </div>
    </div>
  );
}
