"use client";

import { useIsMobile } from "@/hooks/useMobile";
import RestaurantRegisterContainer from "@/components/hotel/register/HotelRegisterContainer";
import MobileRestaurantRegisterContainer from "@/components/hotel/register/MobileRegisterRestaurantContainer";

export default function RegisterAdminWithRestaurantPage() {
  const isMobile = useIsMobile();

  // Renderizar o container adequado com base no tipo de dispositivo
  return isMobile ? (
    <MobileRestaurantRegisterContainer />
  ) : (
    <RestaurantRegisterContainer />
  );
}
