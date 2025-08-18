import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isValidCnpj } from "@/utils/formatCnpj";
import { useToast } from "@/hooks/useToast";
import { useRestaurantUnitFormStore } from "@/stores";

export default function UnitInfoForm() {
  const { unitData, updateUnitData } = useRestaurantUnitFormStore();
  const toast = useToast();

  const handleCnpjPart1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    updateUnitData({ cnpjPart1: value });
  };

  const handleCnpjPart2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    updateUnitData({ cnpjPart2: value });
  };

  const handleCnpjPart3Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    updateUnitData({ cnpjPart3: value });
  };

  const validateCNPJ = (cnpj: string) => {
    return isValidCnpj(cnpj); // Substituir por validação real
  };

  const handleCheckboxChange = (checked: boolean) => {
    updateUnitData({ useMatrixCNPJ: checked });
    if (checked) {

      const cnpj = `${unitData.cnpjPart1}${unitData.cnpjPart2}${unitData.cnpjPart3}`.replace(/\D/g, '');

      const formattedCNPJ = cnpj.replace(/[^\d]/g, '');
      if (formattedCNPJ.length >= 14) {
        const part1 = formattedCNPJ.substring(0, 8);
        const part2 = formattedCNPJ.substring(8, 12);
        const part3 = formattedCNPJ.substring(12, 14);
        updateUnitData({ cnpjPart1: part1, cnpjPart2: part2, cnpjPart3: part3 });
      }
    } else {
      updateUnitData({ cnpjPart1: '', cnpjPart2: '', cnpjPart3: '' });
    }
  };

  const specialties = [
    { value: "acai", label: "Açaí" },
    { value: "pizza", label: "Pizza" },
    { value: "hamburger", label: "Hamburger" },
    { value: "japanese", label: "Japonesa" },
    { value: "brazilian", label: "Brasileira" },
    { value: "italian", label: "Italiana" },
  ];

  return (
    <div className="flex flex-col w-full space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-1">Informações da unidade</h2>
        <p className="text-sm text-gray-500 mb-4">
          Informe os dados do seu negócio.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* CNPJ */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="cnpj-part1" className="py-2 text-lg font-semibold">CNPJ</Label>
            <div className="flex items-center gap-2">
              <Input
                id="cnpj-part1"
                value={unitData.cnpjPart1}
                onChange={handleCnpjPart1Change}
                placeholder="12.345.678"
                className="w-52 h-10 text-lg"
              />
              <span className="text-lg">/</span>
              <Input
                id="cnpj-part2"
                value={unitData.cnpjPart2}
                onChange={handleCnpjPart2Change}
                placeholder="0001"
                className="w-24 h-10 text-lg"
              />
              <span className="text-lg">-</span>
              <Input
                id="cnpj-part3"
                value={unitData.cnpjPart3}
                onChange={handleCnpjPart3Change}
                placeholder="90"
                className="w-14 h-10 text-lg"
              />
            </div>
            <div className="flex items-center gap-2 py-2">
              <Checkbox
                checked={unitData.useMatrixCNPJ}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="matrix-cnpj" className="text-sm">CNPJ baseado na matriz</Label>
            </div>
          </div>

          {/* Razão social */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="socialName" className="py-2 text-lg font-semibold">
              Razão social
            </Label>
            <Input
              id="socialName"
              value={unitData.socialName}
              onChange={(e) => updateUnitData({ socialName: e.target.value })}
              placeholder="Informe a razão social da loja"
              className="w-full h-10 text-lg"
            />
          </div>
        </div>

        {/* Segunda linha: Nome da unidade, Telefone e Especialidade */}
        <div className="grid grid-cols-3 gap-4">
          {/* Nome da unidade */}
          <div>
            <Label htmlFor="unitName" className="block mb-4">
              Nome da unidade
            </Label>
            <Input
              id="unitName"
              value={unitData.name}
              onChange={(e) => updateUnitData({ name: e.target.value })}
              placeholder="Exemplo: Lanchonete do Bio"
              className="w-full h-10"
            />
          </div>

          {/* Telefone */}
          <div>
            <Label htmlFor="phone" className="block mb-4">
              Telefone ou celular
            </Label>
            <Input
              id="phone"
              value={unitData.phone}
              onChange={(e) => updateUnitData({ phone: e.target.value })}
              placeholder="Número de telefone ou celular da unidade"
              className="w-full h-10"
            />
          </div>

          {/* Especialidade */}
          <div>
            <Label htmlFor="specialty" className="block mb-4">
              Especialidade
            </Label>
            <Select
              value={unitData.specialty}
              onValueChange={(value) => updateUnitData({ specialty: value })}
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Açaí" />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((specialty) => (
                  <SelectItem key={specialty.value} value={specialty.value}>
                    {specialty.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
