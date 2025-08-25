import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface formTwoProps {
  cnpj?: string;
  socialName?: string;
  storeName?: string;
  phone?: string;
  specialty?: string;
}

const specialties = [
  { value: "acai", label: "Açaí" },
  { value: "pizza", label: "Pizza" },
  { value: "hamburger", label: "Hamburger" },
  { value: "japanese", label: "Japonesa" },
  { value: "brazilian", label: "Brasileira" },
  { value: "italian", label: "Italiana" },
  { value: "restaurant", label: "Restaurante" },
  { value: "cafeteria", label: "Cafeteria" },
  { value: "bakery", label: "Padaria" },
  { value: "barbecue", label: "Churrasco" },
  { value: "arabic", label: "Comida árabe" },
  { value: "healthy", label: "Saudável" },
];

export default function RestaurantManagerFormTwo({
  cnpj,
  phone,
  socialName,
  specialty,
  storeName,
}: formTwoProps) {
  return (
    <form>
      <div className="flex w-80 flex-col justify-center">
        <div className="flex w-full flex-col justify-center gap-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                type="text"
                name="cnpj"
                placeholder="00.000.000/0000-00"
                value={cnpj}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="socialName">Razão social</Label>
              <Input
                type="text"
                name="cpf"
                placeholder="Informe a razão social da loja"
                value={socialName}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="storeName">Nome da loja</Label>
              <Input
                type="text"
                name="storeName"
                placeholder="Exemplo: Sram Honesto Burger"
                value={storeName}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Telefone ou celular</Label>
              <Input
                type="text"
                name="phone"
                placeholder="Número de telefone ou celular da loja"
                value={phone}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="specialty">Especialidade</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha a especialidade" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={`${specialty}-${item.value}`}
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
