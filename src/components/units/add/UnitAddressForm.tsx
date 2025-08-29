"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRestaurantUnitFormStore } from "@/stores";

export default function UnitAddressForm() {
  const { unitData, updateUnitData } = useRestaurantUnitFormStore();
  const [isLoading, setIsLoading] = useState(false);
  const [ruaEncontrada, setRuaEncontrada] = useState(false);

  const formatCep = (cep: string) => {
    cep = cep.replace(/\D/g, "");

    if (cep.length > 5) {
      cep = `${cep.substring(0, 5)}-${cep.substring(5, 8)}`;
    }

    return cep;
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawCep = e.target.value.replace(/\D/g, "");
    const formattedCep = formatCep(rawCep);

    updateUnitData({ zipCode: formattedCep });

    // Se o campo de CEP for alterado, resetamos o estado de validação
    setRuaEncontrada(false);

    // Se o CEP tiver 8 dígitos, buscar endereço
    if (rawCep.length === 8) {
      try {
        setIsLoading(true);
        const response = await fetch(
          `https://viacep.com.br/ws/${rawCep}/json/`,
        );
        const data = await response.json();

        if (!data.erro) {
          // Verificamos se a API retornou um logradouro (rua)
          if (data.logradouro) {
            updateUnitData({
              street: data.logradouro,
            });
            setRuaEncontrada(true);
          }
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
        <h2 className="mb-1 text-lg font-medium">Endereço da unidade</h2>
        <p className="mb-4 text-sm text-gray-500">
          Preencha as informações de endereço da sua loja.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label
            htmlFor="cep"
            className="mb-2 block"
          >
            CEP
          </Label>
          <Input
            className="h-10"
            id="cep"
            value={unitData.zipCode}
            onChange={handleCepChange}
            placeholder="Digite seu CEP"
            maxLength={9}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <Label
              htmlFor="street"
              className="mb-2 block"
            >
              Rua
            </Label>
            <Input
              className="h-10"
              id="street"
              value={unitData.street}
              onChange={(e) => updateUnitData({ street: e.target.value })}
              placeholder="Digite o nome da rua"
              disabled={isLoading || ruaEncontrada}
            />
          </div>

          <div>
            <Label
              htmlFor="number"
              className="mb-2 block"
            >
              Número
            </Label>
            <Input
              className="h-10"
              id="number"
              value={unitData.number}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                updateUnitData({ number: value });
              }}
              placeholder="Número"
              disabled={isLoading}
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
            className="h-10"
            id="complement"
            value={unitData.complement}
            onChange={(e) => updateUnitData({ complement: e.target.value })}
            placeholder="Ex. Res. Burguer"
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
