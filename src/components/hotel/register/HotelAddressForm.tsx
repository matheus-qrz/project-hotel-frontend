"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHotelFormStore } from "@/stores";
import { formatCep } from "@/utils/formatCep";

export default function HotelAddressForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { formData, updateHotelAddress } = useHotelFormStore();
  const { address } = formData.hotel;

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawCep = e.target.value.replace(/\D/g, "");
    const formattedCep = formatCep(rawCep);

    updateHotelAddress({ zipCode: formattedCep });

    // Se o CEP tiver 8 dígitos, buscar endereço
    if (rawCep.length === 8) {
      try {
        setIsLoading(true);
        const response = await fetch(
          `https://viacep.com.br/ws/${rawCep}/json/`,
        );
        const data = await response.json();

        if (!data.erro) {
          updateHotelAddress({
            street: data.logradouro,
            city: data.localidade,
            state: data.uf,
          });
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-lg font-medium">Endereço do hotel</h2>
        <p className="mb-4 text-sm text-gray-500">
          Preencha as informações de endereço do seu hotel.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <Label
            htmlFor="cep"
            className="mb-2 block"
          >
            CEP
          </Label>
          <Input
            id="cep"
            value={address.zipCode}
            onChange={handleCepChange}
            placeholder="Digite o CEP"
            maxLength={9}
            disabled={isLoading}
            className="w-full"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <Label
              htmlFor="street"
              className="mb-2 block"
            >
              Rua
            </Label>
            <Input
              id="street"
              value={address.street}
              onChange={(e) => updateHotelAddress({ street: e.target.value })}
              placeholder="Nome da rua"
              disabled={isLoading}
              className="w-full"
            />
          </div>

          <div className="w-24">
            <Label
              htmlFor="number"
              className="mb-2 block"
            >
              Número
            </Label>
            <Input
              id="number"
              value={address.number}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                updateHotelAddress({ number: value });
              }}
              placeholder="Nº"
              disabled={isLoading}
              className="w-full"
            />
          </div>
        </div>

        <div>
          <Label
            htmlFor="complement"
            className="mb-2 block"
          >
            Complemento
          </Label>
          <Input
            id="complement"
            value={address.complement}
            onChange={(e) => updateHotelAddress({ complement: e.target.value })}
            placeholder="Ex. Bloco A, Ala Norte"
            disabled={isLoading}
            className="w-full"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <Label
              htmlFor="city"
              className="mb-2 block"
            >
              Cidade
            </Label>
            <Input
              id="city"
              value={address.city}
              onChange={(e) => updateHotelAddress({ city: e.target.value })}
              placeholder="Cidade"
              disabled={isLoading}
              className="w-full"
            />
          </div>

          <div className="w-24">
            <Label
              htmlFor="state"
              className="mb-2 block"
            >
              Estado
            </Label>
            <Input
              id="state"
              value={address.state}
              onChange={(e) =>
                updateHotelAddress({
                  state: e.target.value.toUpperCase().slice(0, 2),
                })
              }
              placeholder="UF"
              disabled={isLoading}
              maxLength={2}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
