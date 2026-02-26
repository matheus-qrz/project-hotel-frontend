"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useHotelFormStore } from "@/stores";

export default function HotelInfoForm() {
  const { formData, updateHotel, updateHotelContact } = useHotelFormStore();
  const { hotel } = formData;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d\s()-]/g, "");
    updateHotelContact({ phone: value });
  };

  const handlePhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    if (digits.length === 0) return;

    let formattedValue;
    if (digits.length <= 10) {
      formattedValue = digits.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    } else {
      formattedValue = digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
    }

    updateHotelContact({ phone: formattedValue });
  };

  const isValidPhone = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, "");
    return digits.length === 10 || digits.length === 11;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-lg font-medium">Informações do hotel</h2>
        <p className="mb-6 text-sm text-gray-500">
          Informe os dados do seu hotel.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <Label
            htmlFor="name"
            className="mb-2 block"
          >
            Nome do hotel
          </Label>
          <Input
            id="name"
            value={hotel.name}
            onChange={(e) => updateHotel({ name: e.target.value })}
            placeholder="Ex. Grand Palace Hotel"
            className="w-full"
          />
        </div>

        <div>
          <Label
            htmlFor="description"
            className="mb-2 block"
          >
            Descrição
          </Label>
          <Textarea
            id="description"
            value={hotel.description}
            onChange={(e) => updateHotel({ description: e.target.value })}
            placeholder="Descreva brevemente o seu hotel"
            className="w-full resize-none"
            rows={3}
          />
        </div>

        <div>
          <Label
            htmlFor="contactPhone"
            className="mb-2 block"
          >
            Telefone de contato
          </Label>
          <Input
            id="contactPhone"
            value={hotel.contact.phone}
            onChange={handlePhoneChange}
            onBlur={handlePhoneBlur}
            placeholder="Telefone ou celular do hotel"
            className="w-full"
            maxLength={15}
          />
          {hotel.contact.phone && !isValidPhone(hotel.contact.phone) && (
            <p className="mt-1 text-sm text-red-500">Telefone inválido</p>
          )}
        </div>

        <div>
          <Label
            htmlFor="contactEmail"
            className="mb-2 block"
          >
            E-mail de contato do hotel
          </Label>
          <Input
            id="contactEmail"
            type="email"
            value={hotel.contact.email}
            onChange={(e) => updateHotelContact({ email: e.target.value })}
            placeholder="contato@seuhotel.com.br"
            className="w-full"
          />
          <p className="mt-1 text-xs text-gray-400">
            Pode ser diferente do e-mail de acesso à plataforma.
          </p>
        </div>
      </div>
    </div>
  );
}
